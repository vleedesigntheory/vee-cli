const program = require('commander');
const { version } = require('./constants');
const path=require('path');

const mapAction = {
    create: {
        alias: 'c', 
        description: 'create a project', 
        examples: [
            'vee-cli create <project-name>'
        ],
    },
    config: {
        alias: 'conf',
        description: 'config project variable',
        examples: [
            'vee-cli config set <k> <v>',
            'vee-cli config get <k>',
        ],
    },
    '*': { 
        alias: '',
        description: 'command not found',
        examples: [],
    }
}

//可以使用Reflect，好处是可以遍历Symbol
Object.keys(mapAction).forEach((action) => {
    program.command(action) 
        .alias(mapAction[action].alias) 
        .description(mapAction[action].description) 
        .action(() => {
            if (action === '*') { 
                console.log(mapAction[action].description)
            } else {
                // console.log(action);
                require(path.resolve(__dirname,action))(...process.argv.slice(3))
            }
        })
});

program.on('--help',()=>{
    console.log('\r\nExamples:');
    Object.keys(mapAction).forEach((action)=>{
        mapAction[action].examples.forEach(example=>{
            console.log('   '+example)
        })
    })
});

program.version(version).parse(process.argv);