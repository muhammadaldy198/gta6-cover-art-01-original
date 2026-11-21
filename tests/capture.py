from pathlib import Path
import json
from browser_smoke import launch
from playwright.sync_api import sync_playwright, expect
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/'.qa'
SHOTS=ROOT/'screenshots'
SHOTS.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser=launch(p)
    page=browser.new_page(viewport={'width':1280,'height':1080},device_scale_factor=1,accept_downloads=True)
    page.goto('http://127.0.0.1:8080')
    page.wait_for_function('window.__shotReady===true')
    page.wait_for_load_state('networkidle')
    manifest=[]
    def save_export(filename,source_name,dimensions):
        with page.expect_download() as pending:
            page.get_by_role('button',name='Export PNG',exact=True).click()
        original=QA/source_name
        pending.value.save_as(original)
        with Image.open(original) as im:
            image=im.convert('RGB')
            image.thumbnail(dimensions,Image.Resampling.LANCZOS)
            image.save(SHOTS/filename,'JPEG',quality=88,optimize=True,subsampling=2)
        manifest.append({'name':filename,'source':source_name,'kind':'actual downloaded PNG, scaled only'})
    save_export('01-after-hours-cover.jpg','cover-landscape-original.png',(1280,720))
    expect(page.get_by_role('status')).to_contain_text('PNG ready')
    page.screenshot(path=str(SHOTS/'02-after-hours-studio.jpg'),type='jpeg',quality=88,full_page=False)
    manifest.append({'name':'02-after-hours-studio.jpg','kind':'unmodified browser screenshot, loaded kit photos'})
    page.get_by_role('combobox',name='Output size',exact=True).select_option('1080x1350')
    page.get_by_role('textbox',name='Title',exact=True).fill('Last Check-In')
    page.get_by_label('Caption',exact=True).fill('The coast keeps its secrets.')
    page.get_by_label('Color grade',exact=True).select_option('noir')
    page.locator('[data-panel="2"]').click()
    for selector,value in [('#zoom','160'),('#pan-y','100')]:
        page.locator(selector).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));}',value)
    save_export('03-last-check-in-portrait.jpg','cover-portrait-original.png',(864,1080))
    page.get_by_role('combobox',name='Output size',exact=True).select_option('1080x1080')
    page.get_by_label('Layout',exact=True).select_option('split')
    page.get_by_label('Color grade',exact=True).select_option('neon')
    page.get_by_role('textbox',name='Title',exact=True).fill('Neon Alibi')
    page.get_by_label('Caption',exact=True).fill('Three stories. One wrong turn.')
    save_export('04-neon-alibi-square.jpg','cover-square-original.png',(1080,1080))
    for row in manifest:
        path=SHOTS/row['name']
        with Image.open(path) as image: row.update(width=image.width,height=image.height,bytes=path.stat().st_size)
        assert row['bytes']<=262144,row
        assert min(row['width'],row['height'])>=480 and max(row['width'],row['height'])<=1280,row
    assert len(list(SHOTS.iterdir()))==4
    (QA/'screenshot-manifest.json').write_text(json.dumps(manifest,indent=2))
    thumbs=[]
    for row in manifest:
        with Image.open(SHOTS/row['name']) as image:
            thumb=image.convert('RGB');thumb.thumbnail((384,320),Image.Resampling.LANCZOS);thumbs.append(thumb.copy())
    sheet=Image.new('RGB',(768,640),'#24313b')
    for i,image in enumerate(thumbs):sheet.paste(image,((i%2)*384,(i//2)*320))
    sheet.save(QA/'thumbnails.jpg',quality=94)
    print(json.dumps(manifest,indent=2))
    browser.close()
