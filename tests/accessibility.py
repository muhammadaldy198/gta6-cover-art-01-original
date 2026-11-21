from pathlib import Path
import json
from browser_smoke import launch
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/'.qa/revision'
QA.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=launch(p)
    page=browser.new_page(viewport={'width':1280,'height':1080})
    page.goto('http://127.0.0.1:8080')
    page.wait_for_function('window.__shotReady===true')
    page.add_script_tag(path=str(ROOT/'.qa/axe/node_modules/axe-core/axe.min.js'))
    results=[]
    for viewport in [{'width':1280,'height':1080},{'width':390,'height':844}]:
        page.set_viewport_size(viewport)
        result=page.evaluate('async()=>await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa","wcag22aa"]}})')
        failures=[{'id':v['id'],'impact':v['impact'],'nodes':[{'html':n['html'],'failureSummary':n.get('failureSummary','')} for n in v['nodes']]} for v in result['violations']]
        results.append({'viewport':viewport,'violations':failures,'passes':len(result['passes'])})
    (QA/'accessibility-results.json').write_text(json.dumps(results,indent=2))
    print(json.dumps(results,indent=2))
    assert all(not result['violations'] for result in results)
    browser.close()
