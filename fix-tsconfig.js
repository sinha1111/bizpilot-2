const fs = require("fs");
let t = fs.readFileSync("tsconfig.json", "utf8");
if (!t.includes("ignoreDeprecations")) {
  t = t.replace(/("baseUrl"\s*:\s*"\.",?)/, '"baseUrl": ".",\n    "ignoreDeprecations": "6.0",');
  fs.writeFileSync("tsconfig.json", t);
}
console.log(t.split("\n").slice(0, 10).join("\n"));
