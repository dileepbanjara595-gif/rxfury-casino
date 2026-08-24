const fs = require('fs');
let code = fs.readFileSync('src/app/profile/page.tsx', 'utf8');
code = code.replace(/const displayName = .*?: 'Player' \+ user\.id\.substring\(0, 4\);/s, "const displayName = anyUser?.firstName ? (anyUser.firstName + ' ' + (anyUser.lastName || '')).trim() : 'Player' + user.id.substring(0, 4);");
fs.writeFileSync('src/app/profile/page.tsx', code);
