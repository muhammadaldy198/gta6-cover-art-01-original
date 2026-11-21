from pathlib import Path
import json
from time import monotonic
from browser_smoke import launch
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/'.qa/art-upgrade'
QA.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=launch(p)
    page=browser.new_page(viewport={'width':1280,'height':960},accept_downloads=True)
    page.goto('http://127.0.0.1:8080')
    page.wait_for_function('window.__shotReady===true')
    finish=page.get_by_label('Photo treatment',exact=True)
    expect(finish).to_be_visible()
    page.get_by_label('Layout',exact=True).select_option('velocity')
    page.locator('[data-panel="2"]').click()
    page.locator('#pan-y').evaluate('(e)=>{e.value=78;e.dispatchEvent(new Event("input",{bubbles:true}));}')
    captures=[]
    for grade in ['sunset','neon','noir']:
        page.get_by_label('Color grade',exact=True).select_option(grade)
        for treatment in ['photo','illustrated','screenprint']:
            start=monotonic()
            finish.select_option(treatment)
            with page.expect_download() as download:
                page.get_by_role('button',name='Export PNG',exact=True).click()
            name=f'candidate-{treatment}.png' if grade=='sunset' else f'candidate-{grade}-{treatment}.png'
            download.value.save_as(QA/name)
            captures.append({'grade':grade,'treatment':treatment,'seconds':round(monotonic()-start,3)})
    print(json.dumps(captures,indent=2))
    browser.close()
