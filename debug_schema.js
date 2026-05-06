/**
 * Introspect Buffer GraphQL schema để khám phá các type liên quan đến Threads.
 * Chạy: node --env-file=.env debug_schema.js [type_name]
 *
 * Ví dụ:
 *   node --env-file=.env debug_schema.js                     → in tất cả type liên quan Threads
 *   node --env-file=.env debug_schema.js CreatePostInput      → in field của CreatePostInput
 *   node --env-file=.env debug_schema.js ThreadsPostMetadataInput
 */

const key = process.env.BUFFER_API_KEY;
if (!key) { console.error("Thiếu BUFFER_API_KEY trong .env"); process.exit(1); }

async function introspectType(typeName) {
  const res = await fetch("https://api.buffer.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
    body: JSON.stringify({
      query: `{
        __type(name: "${typeName}") {
          name kind description
          inputFields {
            name description
            type {
              name kind
              ofType { name kind ofType { name kind ofType { name kind } } }
            }
          }
          fields {
            name description
            type {
              name kind
              ofType { name kind ofType { name kind ofType { name kind } } }
            }
          }
          enumValues { name description }
        }
      }`
    })
  });
  const d = await res.json();
  return d.data?.__type ?? null;
}

function resolveTypeName(t) {
  if (!t) return "?";
  if (t.name) return `${t.kind === "NON_NULL" ? "!" : ""}${t.name}`;
  if (t.kind === "NON_NULL") return `${resolveTypeName(t.ofType)}!`;
  if (t.kind === "LIST") return `[${resolveTypeName(t.ofType)}]`;
  return resolveTypeName(t.ofType);
}

function printType(type) {
  if (!type) { console.log("  (not found)"); return; }
  console.log(`\n[${type.kind}] ${type.name}`);
  if (type.description) console.log(`  ${type.description}`);

  const fields = type.inputFields || type.fields || [];
  if (fields.length > 0) {
    console.log(`  Fields (${fields.length}):`);
    fields.forEach(f => {
      const typeName = resolveTypeName(f.type);
      const desc = f.description ? `  // ${f.description}` : "";
      console.log(`    ${f.name}: ${typeName}${desc}`);
    });
  }

  if (type.enumValues?.length > 0) {
    console.log(`  Values:`);
    type.enumValues.forEach(v => {
      const desc = v.description ? `  // ${v.description}` : "";
      console.log(`    ${v.name}${desc}`);
    });
  }
}

async function discoverThreadsTypes() {
  // Tất cả type cần khám phá để hiểu đầy đủ schema Threads
  const targets = [
    "CreatePostInput",
    "PostMetadataInput",
    "ThreadsPostMetadataInput",
    "PostTypeThreads",          // enum loại bài Threads
    "ThreadsReplyControl",      // kiểm soát ai được reply
    "AssetsInput",
    "VideoAssetInput",
    "ImageAssetInput",
  ];

  console.log("\n" + "=".repeat(60));
  console.log("  Buffer GraphQL Schema — Threads Types");
  console.log("=".repeat(60));

  for (const name of targets) {
    const t = await introspectType(name);
    printType(t);
  }

  // Tìm thêm các type chứa "Thread" trong tên
  console.log("\n\n--- Tìm tất cả type có 'Thread' hoặc 'Threads' trong tên ---");
  const schemaRes = await fetch("https://api.buffer.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
    body: JSON.stringify({
      query: `{ __schema { types { name kind } } }`
    })
  });
  const schema = await schemaRes.json();
  const threadTypes = (schema.data?.__schema?.types ?? [])
    .filter(t => t.name.toLowerCase().includes("thread") || t.name.toLowerCase().includes("threads"))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (threadTypes.length === 0) {
    console.log("  Không tìm thấy type nào chứa 'thread'");
  } else {
    console.log(`  Tìm thấy ${threadTypes.length} type(s):`);
    threadTypes.forEach(t => console.log(`    [${t.kind.padEnd(12)}] ${t.name}`));

    // Auto-introspect từng type tìm được
    console.log("\n--- Chi tiết từng type ---");
    for (const t of threadTypes) {
      const detail = await introspectType(t.name);
      printType(detail);
    }
  }
}

async function main() {
  const targetType = process.argv[2];
  if (targetType) {
    const t = await introspectType(targetType);
    printType(t);
  } else {
    await discoverThreadsTypes();
  }
}

main().catch(console.error);
