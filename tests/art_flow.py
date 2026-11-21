from pathlib import Path
from io import BytesIO
import json
from PIL import Image, ImageDraw
from browser_smoke import launch
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/'.qa/art-upgrade'
QA.mkdir(parents=True,exist_ok=True)

with sync_playwright() as p:
    browser=launch(p)
    page=browser.new_page(viewport={'width':1280,'height':1000},accept_downloads=True)
    errors=[];external=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('request',lambda req:external.append(req.url) if req.url.startswith(('https:','http:')) and not req.url.startswith('http://127.0.0.1:8080/') else None)
    page.goto('http://127.0.0.1:8080')
    page.wait_for_function('window.__shotReady===true')
    result=page.evaluate('''async()=>{
      const {inkPhoto}=await import('./src/cover.js');
      const input=document.createElement('canvas');input.width=6000;input.height=1;
      const g=input.getContext('2d');g.fillStyle='#c97951';g.fillRect(0,0,6000,1);
      const image=new Image();image.src=input.toDataURL();await image.decode();
      const layer=inkPhoto(image,'sunset','illustrated');
      return {width:layer.width,height:layer.height,cached:inkPhoto(image,'sunset','illustrated')===layer};
    }''')
    assert result=={'width':960,'height':1,'cached':True},result
    print('PASS extreme-aspect photo preparation stays nonzero and reuses cached pixels')
    timings=page.evaluate('''async()=>{
      const {inkPhoto}=await import('./src/cover.js');
      const image=new Image();image.src='./samples/pier.jpg';await image.decode();
      const start=performance.now(),layer=inkPhoto(image,'neon','illustrated');
      const prepared=performance.now()-start;
      const again=performance.now();
      for(let i=0;i<30;i++)if(inkPhoto(image,'neon','illustrated')!==layer)throw Error('cache miss');
      return {prepare_ms:prepared,thirty_cache_reads_ms:performance.now()-again,width:layer.width,height:layer.height};
    }''')
    assert timings['prepare_ms']<4000 and timings['thirty_cache_reads_ms']<100,timings
    print('PASS measured photo preparation and 30 cache identity checks',timings)
    page.locator('#photos').set_input_files(str(ROOT/'app/samples/pier.jpg'))
    expect(page.get_by_role('status')).to_contain_text('1 local photo loaded')
    assert page.locator('#pan-y').input_value()=='15','new local photos should start top-biased, not crop away the upper face'
    page.get_by_role('button',name='Use this photo in all panels').click()
    for index in range(7):
        page.locator(f'[data-panel="{index}"]').click()
        assert page.locator('#pan-y').input_value()=='15'
    page.get_by_role('button',name='Reset studio').click()
    expect(page.get_by_role('status')).to_contain_text('7 distinct demo images loaded')
    print('PASS own photo upload and single-photo fill use independent top-biased starting crops')
    geometric=Image.new('RGB',(1200,800),'#f3c966')
    draw=ImageDraw.Draw(geometric)
    draw.rectangle((40,70,550,730),fill='#28595f')
    draw.ellipse((650,80,1130,560),fill='#d16a6c')
    draw.polygon([(580,730),(800,370),(1150,730)],fill='#253449')
    draw.line((40,400,1160,400),fill='#fff6da',width=18)
    buffer=BytesIO();geometric.save(buffer,format='PNG')
    page.context.set_offline(True)
    page.locator('#photos').set_input_files({'name':'original-geometric.png','mimeType':'image/png','buffer':buffer.getvalue()})
    expect(page.get_by_role('status')).to_contain_text('1 local photo loaded')
    page.get_by_role('button',name='Use this photo in all panels').click()
    for index in range(7):
        page.locator(f'[data-panel="{index}"]').click()
        assert page.locator('#panel-photo').input_value()=='7'
    page.get_by_role('textbox',name='Title',exact=True).fill('W'*26)
    page.get_by_label('Caption',exact=True).fill('A'*68)
    combinations=[]
    for size in ['1920x1080','1080x1350','1080x1080']:
        page.get_by_role('combobox',name='Output size',exact=True).select_option(size)
        for layout in ['seven','velocity','dossier','split','triptych']:
            page.get_by_label('Layout',exact=True).select_option(layout)
            for grade in ['sunset','neon','noir']:
                page.get_by_label('Color grade',exact=True).select_option(grade)
                for finish in ['illustrated','screenprint','photo']:
                    old=page.locator('#cover').get_attribute('data-rendered')
                    page.get_by_label('Photo treatment',exact=True).select_option(finish)
                    page.wait_for_function('(old)=>document.querySelector("#cover").dataset.rendered!==old',arg=old)
                    assert page.locator('#cover').evaluate('(c)=>{const d=c.getContext("2d").getImageData(c.width*.65,c.height*.3,1,1).data;return d[3]===255 && d[0]+d[1]+d[2]>80;}')
                    combinations.append([size,layout,grade,finish])
        # An actual PNG download for each exact size, with the original synthetic input.
        page.get_by_label('Layout',exact=True).select_option('velocity')
        page.get_by_label('Color grade',exact=True).select_option('sunset')
        page.get_by_label('Photo treatment',exact=True).select_option('illustrated')
        with page.expect_download() as download:
            page.get_by_role('button',name='Export PNG',exact=True).click()
        path=QA/f'geometric-{size}.png';download.value.save_as(path)
        with Image.open(path) as image:
            assert image.size==tuple(map(int,size.split('x')))
            image.verify()
    assert len(combinations)==135
    print('PASS 135 actual renderer combinations with face-free local geometric input; 3 PNG sizes offline')
    page.get_by_role('textbox',name='Title',exact=True).fill('')
    page.get_by_label('Caption',exact=True).fill('')
    page.get_by_label('Edition / key tag',exact=True).fill('')
    page.get_by_label('Layout',exact=True).select_option('seven')
    with page.expect_download() as download:
        page.get_by_role('button',name='Export PNG',exact=True).click()
    download.value.save_as(QA/'empty-caption.png')
    page.locator('[data-panel="0"]').click()
    page.locator('#zoom').focus();page.keyboard.press('ArrowRight')
    assert page.locator('#zoom').input_value()=='101'
    page.locator('[data-panel="1"]').click()
    assert page.locator('#zoom').input_value()=='100'
    print('PASS empty/maximum captions and independent keyboard crop with new layout')
    assert not errors,errors
    assert not external,external
    (QA/'art-flow-results.json').write_text(json.dumps({'combinations':len(combinations),'prepare':timings,'errors':errors,'external_requests':external,'downloads':3},indent=2))
    browser.close()
