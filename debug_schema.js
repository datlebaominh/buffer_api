const key = process.env.BUFFER_API_KEY;

fetch('https://api.buffer.com/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
  body: JSON.stringify({
    query: `{
      __type(name: "AssetsInput") {
        name
        inputFields {
          name
          type {
            name
            kind
            ofType { name kind ofType { name kind } }
          }
        }
      }
    }`
  })
}).then(r => r.json()).then(d => {
  if (!d.data?.__type) {
    console.log('Type not found. Raw response:', JSON.stringify(d, null, 2));
    return;
  }
  const fields = d.data.__type.inputFields || [];
  console.log(`\nAssetsInput fields (${fields.length}):`);
  fields.forEach(f => {
    const inner = f.type.ofType?.ofType ?? f.type.ofType ?? f.type;
    const nullable = f.type.kind !== 'NON_NULL';
    console.log(`  ${f.name}: ${inner.name}${nullable ? '' : '!'}`);
  });
}).catch(console.error);
