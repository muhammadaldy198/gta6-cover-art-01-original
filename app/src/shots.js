// Query strings select ordinary editor values; the same drawCover path is always used.
export function querySettings(query) {
  const valid = (key, values, fallback) => values.includes(query.get(key)) ? query.get(key) : fallback;
  return {
    size:valid('size',['1920x1080','1080x1080','1080x1350'],'1920x1080'),
    layout:valid('layout',['dossier','split','triptych'],'dossier'),
    grade:valid('grade',['sunset','neon','noir'],'sunset'),
    title:(query.get('title')||'After Hours').slice(0,26),
    subtitle:(query.get('caption')||'One last score. No way back.').slice(0,68),
    coverOnly:query.get('view')==='cover',
  };
}
