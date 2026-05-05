const key = process.env.BUFFER_API_KEY;

fetch('https://api.buffer.com/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
  body: JSON.stringify({
    query: `query GetChannels($orgId: String!) {
      channels(input: { organizationId: $orgId }) {
        id name service
      }
    }`,
    variables: { orgId: '69f80279d110cb66bf84309c' }
  })
}).then(r => r.text()).then(console.log).catch(console.error);
