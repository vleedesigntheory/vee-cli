const axios = require('axios');
const ora = require('ora');
const Inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const downloadGitRepo = require('download-git-repo');
const ncp = require('ncp');
const MetalSmith = require('metalsmith'); // 遍历文件夹 找需不需要渲染
const { render } = require('consolidate').ejs; // 统一所有的模板引擎
const { repoUrl, tagUrl, baseUrl, downloadDirectory } = require('./constants');

// promise化
const downloadGitRepoPro = promisify(downloadGitRepo);
const ncpPro = promisify(ncp);
const renderPro = promisify(render);

const fetchRepoList = async () => {
    const { data } = await axios.get(`${repoUrl}/repos`);
    return data;
}

const fetchTagList = async (repo) => {
    const { data } = await axios.get(`${tagUrl}/${repo}/tags`);
    return data;
}

const waitLoading = (fn, message) => async (...args) => {
    const spinner = ora(message);
    spinner.start();
    const result = await fn(...args);
    spinner.succeed();
    return result;
}

const download = async (repo, tag) => {
    let api = `${baseUrl}/${repo}`;
    if(tag) {
        api += `#${tag}`;
    }
    const dest = `${downloadDirectory}/${repo}`;
    await downloadGitRepoPro(api, dest);
    return dest;
}


module.exports = async ( projectName ) => {
    // 获取仓库
    const repos = await waitLoading(fetchRepoList, ' fetching template ...')();
    const reposName = repos.map( item => item.name );
    const { repo } = await Inquirer.prompt({
        name: 'repo',
        type: 'list',
        message: 'please choice a template to create project',
        choices: reposName
    })
    // 获取版本号
    const tags = await waitLoading(fetchTagList, ' fetching tags ...')(repo);
    const tagsName = tags.map( item => item.name );
    const { tag } = await Inquirer.prompt({
        name: 'tag',
        type: 'list',
        message: 'please choice a template to create project',
        choices: tagsName
    });

    const result = await waitLoading(download, 'download template ...')(repo,tag);

    // 判断是否存在ask.js文件
    if(!fs.existsSync(path.join(result, 'ask.js'))) {
        // 直接下载
        await ncpPro(result, path.resolve(projectName));
    } else {
        // 模板渲染后再拷贝
        await new Promise((resolve,reject) => {
          MetalSmith(__dirname)
            .source(result)
            .destination(path.resolve(projectName))
            .use(async (files, metal, done) => {
                const a = require(path.join(result, 'ask.js'));
                const r = await Inquirer.prompt(a);
                const m = metal.metadata();
                Object.assign(m, r);
                delete files['ask.js'];
                done()
            })
            .use((files, metal, done) => {
                const meta = metal.metadata();
                Object.keys(files).forEach(async (file) => {
                    let c = files[file].contents.toString();
                    // 只有js和json文件才去做处理
                    if(file.includes('js') || file.includes('json')) {
                        // 判断是否是模板 可用正则匹配
                        if(c.includes('<%')) {
                            c = await renderPro(c, meta);
                            files[file].contents = Buffer.from(c);
                        }
                    }
                })
                done()
            })
            .build((err) => {
                if(err) {
                    reject()
                } else {
                    resolve()
                }
            })
        })
    }
}