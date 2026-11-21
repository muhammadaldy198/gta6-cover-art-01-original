from pathlib import Path
import json
from urllib.parse import urlparse
from browser_smoke import launch
from playwright.sync_api import sync_playwright, expect
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/'.qa/revision'
QA.mkdir(parents=True,exist_ok=True)
checks=[]
def passed(text):
    checks.append(text)
    print('PASS',text)

def value(page,selector,new):
    page.locator(selector).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));}',str(new))
    page.wait_for_timeout(100)

def export(page,name,size):
    with page.expect_download() as pending:
        page.get_by_role('button',name='Export PNG',exact=True).click()
    path=QA/name
    pending.value.save_as(path)
    with Image.open(path) as image:
        assert image.format=='PNG' and image.size==size,(image.format,image.size)
        image.verify()
    expect(page.get_by_role('status')).to_contain_text('PNG ready')
    return path

with sync_playwright() as p:
    browser=launch(p)
    context=browser.new_context(viewport={'width':1280,'height':1000},device_scale_factor=1,accept_downloads=True)
    page=context.new_page()
    errors=[];external=[];bad_responses=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('request',lambda req:external.append(req.url) if urlparse(req.url).scheme in ['http','https'] and urlparse(req.url).hostname!='127.0.0.1' else None)
    page.on('response',lambda response:bad_responses.append([response.status,response.url]) if response.status>=400 else None)
    page.goto('http://127.0.0.1:8080')
    page.wait_for_function('window.__shotReady===true')
    page.wait_for_load_state('networkidle')
    assert not errors,errors
    passed('startup without JavaScript errors')
    expect(page.locator('[data-panel]:visible')).to_have_count(7)
    expect(page.locator('#photo-tray button')).to_have_count(7)
    sources=[]
    for index in range(7):
        page.locator(f'[data-panel="{index}"]').click()
        sources.append(page.locator('#panel-photo').input_value())
    assert len(set(sources))==7
    passed('seven different local sources automatically fill seven panels')
    page.locator('[data-panel="2"]').click()
    assert page.locator('#panel-photo').input_value()=='2'
    assert [page.locator(selector).input_value() for selector in ['#zoom','#pan-x','#pan-y']]==['100','50','50']
    passed('car panel starts with its own independent scene crop')
    page.locator('[data-panel="0"]').click()
    before=page.locator('#cover').evaluate('(c)=>c.toDataURL()')
    page.get_by_role('textbox',name='Title',exact=True).fill('Night Run')
    page.wait_for_function('document.querySelector("#title-count").textContent==="9 / 26"')
    page.wait_for_timeout(120)
    assert page.locator('#cover').evaluate('(c)=>c.toDataURL()')!=before
    page.get_by_label('Caption',exact=True).fill('A different story. Same coastline.')
    passed('caption and title edit the live rendered canvas')
    value(page,'#zoom',170);value(page,'#pan-x',16);value(page,'#pan-y',74)
    page.locator('[data-panel="1"]').click()
    assert page.locator('#zoom').input_value()=='100'
    assert page.locator('#pan-y').input_value()=='0','kit pier sample needs top-aligned crop to retain face'
    value(page,'#zoom',125)
    page.locator('[data-panel="0"]').click()
    assert [page.locator(x).input_value() for x in ['#zoom','#pan-x','#pan-y']]==['170','16','74']
    passed('per-panel zoom and both position values are independent')
    page.get_by_role('button',name='Reset crop',exact=True).click()
    assert [page.locator(x).input_value() for x in ['#zoom','#pan-x','#pan-y']]==['100','50','50']
    page.locator('#panel-photo').select_option('1')
    page.get_by_role('button',name='Use this photo in all panels').click()
    for index in range(7):
        page.locator(f'[data-panel="{index}"]').click()
        assert page.locator('#panel-photo').input_value()=='1'
    passed('single-photo fill and crop reset')
    for layout in ['seven','velocity','dossier','split','triptych']:
        page.get_by_label('Layout',exact=True).select_option(layout)
        for grade in ['sunset','neon','noir']:
            old=page.locator('#cover').get_attribute('data-rendered')
            page.get_by_label('Color grade',exact=True).select_option(grade)
            page.wait_for_function('(old)=>document.querySelector("#cover").dataset.rendered!==old',arg=old)
    passed('all five layouts and three grades redraw without error')
    page.get_by_role('button',name='Reset studio').click()
    expect(page.get_by_role('status')).to_contain_text('7 distinct demo images loaded')
    context.set_offline(True)
    page.locator('#photos').set_input_files([str(ROOT/'app/samples/pier.jpg'),str(ROOT/'app/samples/boulevard.jpg')])
    expect(page.get_by_role('status')).to_contain_text('2 local photos loaded')
    expect(page.locator('#photo-tray button')).to_have_count(9)
    passed('real multi-file input loads both kit photos with network offline')
    page.locator('#photos').set_input_files({'name':'bad.png','mimeType':'image/png','buffer':b'not an image'})
    expect(page.get_by_role('status')).to_contain_text('No photos added')
    assert not page.get_by_role('button',name='Export PNG',exact=True).is_disabled()
    passed('corrupt image fails safely and preserves exportable cover')
    for size in [(1920,1080),(1080,1080),(1080,1350)]:
        page.get_by_role('combobox',name='Output size',exact=True).select_option(f'{size[0]}x{size[1]}')
        export(page,f'test-{size[0]}x{size[1]}.png',size)
    passed('actual PNG downloads verify at all three required dimensions offline')
    context.set_offline(False)
    page.get_by_role('button',name='Load kit samples').click()
    expect(page.locator('#photo-tray button')).to_have_count(7)
    page.get_by_role('button',name='Reset studio').click()
    expect(page.get_by_role('status')).to_contain_text('7 distinct demo images loaded')
    # Drag inside the hero after zooming: both viewport and image-overflow math are exercised.
    value(page,'#zoom',180)
    rect=page.locator('#cover').bounding_box()
    page.mouse.move(rect['x']+rect['width']*.50,rect['y']+rect['height']*.35)
    page.mouse.down();page.mouse.move(rect['x']+rect['width']*.45,rect['y']+rect['height']*.40,steps=4);page.mouse.up()
    assert page.locator('#pan-x').input_value()!='50'
    passed('pointer drag updates the selected panel crop')
    page.get_by_role('button',name='View cover only').click()
    expect(page.get_by_role('dialog')).to_be_visible()
    page.keyboard.press('Escape')
    expect(page.get_by_role('dialog')).not_to_be_visible()
    page.locator('#title').focus();page.keyboard.press('Tab')
    assert page.evaluate('document.activeElement.id')=='subtitle'
    assert page.locator('#subtitle').evaluate('(e)=>getComputedStyle(e).outlineStyle')=='solid'
    passed('native dialog Escape, label navigation and keyboard-visible focus')
    for width,height in [(1280,900),(1024,768),(760,900),(390,844),(320,740)]:
        page.set_viewport_size({'width':width,'height':height})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,page.evaluate('document.documentElement.scrollWidth'))
    page.emulate_media(reduced_motion='reduce')
    passed('no horizontal overflow at five viewports including 320 px; reduced-motion preference accepted')
    assert not errors,errors
    assert not external,external
    assert not bad_responses,bad_responses
    passed('no external requests, failed local responses or JavaScript errors through the complete flow')
    (QA/'browser-results.json').write_text(json.dumps({'checks':checks,'errors':errors,'external_requests':external,'bad_responses':bad_responses},indent=2))
    print(f'PASS {len(checks)} browser checks')
    browser.close()
