const { version } = require('../package.json');

// GET /users/:username/repos 个人
// const repoUrl = 'http://api.github.com/users/we452366';
// const tagUrl = 'https://api.github.com/repos/we452366';
// const baseUrl = 'we452366';
// GET /orgs/:org/repos 组织
const repoUrl = 'http://api.github.com/orgs/vee-cli';
const tagUrl = 'http://api.github.com/repos/vee-cli';
const baseUrl = 'vee-cli';
const downloadDirectory = `${process.env[ process.platform == 'darwin' ? 'HOME' : 'USERPROFILE' ]}/.template`;

module.exports = {
    version,
    repoUrl,
    tagUrl,
    baseUrl,
    downloadDirectory
}