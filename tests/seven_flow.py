from pathlib import Path
from io import BytesIO
import json
from PIL import Image, ImageDraw
from browser_smoke import launch
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/'.qa/seven-flow'
QA.mkdir(parents=True,exist_ok=True)
checks=[]

def controls(page):
    return [page.locator(s).input_value() for s in ['#panel-photo','#zoom','#pan-x','#pan-y']]

def change(page,selector,value):
    old=page.locator('#cover').get_attribute('data-rendered')
    page.locator(selector).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));}',str(value))
    page.wait_for_function('(old)=>document.querySelector("#cover").dataset.rendered!==old',arg=old)

with sync_playwright() as p:
    browser=launch(p)
    page=browser.new_page(viewport={'width':1280,'height':1080},accept_downloads=True)
    errors=[]; external=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('request',lambda req:external.append(req.url) if req.url.startswith(('https:','http:')) and not req.url.startswith('http://127.0.0.1:8080/') else None)
    page.goto('http://127.0.0.1:8080')
    page.wait_for_function('window.__shotReady===true')
    page.wait_for_load_state('networkidle')
    # Seven distinct original fixtures, including extreme aspects and a dark object.
    files=[]
    for i,(w,h) in enumerate([(120,900),(900,120),(640,640),(400,700),(1000,500),(600,800),(720,480)]):
        image=Image.new('RGB',(w,h),(8,12,18) if i==5 else (30+i*27,60+i*18,160-i*15))
        draw=ImageDraw.Draw(image)
        draw.rectangle((w*.12,h*.15,w*.7,h*.8),outline='#fff0c9',width=9)
        draw.ellipse((w*.3,h*.2,w*.9,h*.7),fill=(210-i*12,120+i*12,80+i*14))
        stream=BytesIO();image.save(stream,format='PNG')
        files.append({'name':f'original-scene-{i}.png','mimeType':'image/png','buffer':stream.getvalue()})
    page.context.set_offline(True)
    page.locator('#photos').set_input_files(files)
    expect(page.get_by_role('status')).to_contain_text('7 local photos loaded')
    before=[]
    for i in range(7):
        page.locator(f'[data-panel="{i}"]').click();before.append(controls(page))
    assert [row[0] for row in before]==list(map(str,range(7,14))),before
    checks.append('seven-file input assigns all seven panels to distinct new photos offline')
    page.locator('[data-panel="4"]').click()
    change(page,'#zoom',249);change(page,'#pan-x',0);change(page,'#pan-y',100)
    page.locator('#panel-photo').select_option('0')
    change(page,'#zoom',187)
    for i in range(7):
        page.locator(f'[data-panel="{i}"]').click()
        if i!=4:assert controls(page)==before[i],(i,controls(page),before[i])
        else:assert controls(page)[:2]==['0','187']
    checks.append('replacing and recropping one panel preserves all six others')
    # Hit-test each polygon through an actual pointer click at its centroid.
    centroids=page.evaluate('''async()=>{
      const {panelFrames}=await import('./src/geometry.js');const c=document.querySelector('#cover');
      return panelFrames(c.width,c.height,'seven').map(f=>[f.points.reduce((s,p)=>s+p[0],0)/4/c.width,f.points.reduce((s,p)=>s+p[1],0)/4/c.height]);
    }''')
    for i,(x,y) in enumerate(centroids):
        page.locator('#cover').scroll_into_view_if_needed();rect=page.locator('#cover').bounding_box()
        page.mouse.click(rect['x']+x*rect['width'],rect['y']+y*rect['height'])
        expect(page.locator(f'[data-panel="{i}"]')).to_have_attribute('aria-pressed','true')
    checks.append('all seven angular regions select their own crop through real pointer hit tests')
    page.locator('#layout').select_option('triptych')
    expect(page.locator('[data-panel]:visible')).to_have_count(3)
    page.locator('#layout').select_option('seven')
    expect(page.locator('[data-panel]:visible')).to_have_count(7)
    page.locator('[data-panel="4"]').click();assert controls(page)[:2]==['0','187']
    checks.append('legacy layout hides only unused controls and preserves seven-panel state')
    for size in ['1920x1080','1080x1080','1080x1350']:
        page.locator('#size').select_option(size)
        for i in range(7):
            page.locator(f'[data-panel="{i}"]').click()
            change(page,'#zoom',300);change(page,'#pan-x',0 if i%2 else 100);change(page,'#pan-y',100 if i%2 else 0)
        with page.expect_download() as d:page.locator('#export').click()
        path=QA/f'extreme-crops-{size}.png';d.value.save_as(path)
        with Image.open(path) as image:assert image.size==tuple(map(int,size.split('x')));image.verify()
    checks.append('all seven extreme portrait/landscape/dark inputs export three exact PNG sizes offline')
    assert not errors,errors
    assert not external,external
    (QA/'results.json').write_text(json.dumps({'checks':checks,'errors':errors,'external':external},indent=2))
    for check in checks:print('PASS',check)
    print(f'PASS {len(checks)} seven-panel browser checks')
    browser.close()
