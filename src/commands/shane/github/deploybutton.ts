import { flags, SfdxCommand } from '@salesforce/command';
import { URL } from 'url';

import fs = require('fs-extra');

const startText = '<!-- launchButton -->';
const stopText = '<!-- launchButtonStop -->';
const regex = new RegExp(`(?<=${startText})(\n*.*\n*)(?=${stopText})`);

export default class DeployButton extends SfdxCommand {
    public static description = 'modify your local readme file to include a deployer link/button';

    protected static flagsConfig = {
        deployer: flags.url({
            char: 'd',
            description: 'the base url for your deployer',
            default: new URL('https://hosted-scratch.herokuapp.com'),
            required: true
        }),
        button: flags.url({
            char: 'b',
            description: 'the public url where your button lives',
            default: new URL('https://raw.githubusercontent.com/mshanemc/deploy-to-sfdx/master/client-src/resources/images/sfdx_it_now.png'),
            required: true
        })
        //  type: flags.string({ char: 't', description: 'want a link or a button?', required: true, default: 'button' })
    };

    protected static requiresProject = true;

    public async run(): Promise<any> {
        // get repo url from package.json
        const repoUrl = (await fs.readJSON('package.json')).repository.url.replace('git+', '').replace('.git', '');
        // this.ux.log(repoUrl);

        if (!repoUrl) {
            throw new Error(`a repo url was not found in your project's package.json file`);
        }
        // read in the README
        let readmeContents = await fs.readFile('README.md', 'utf-8');
        // check for existing button code, replace if found
        if (readmeContents.match(regex)) {
            // console.log('already has a button...will try to replace');q
            readmeContents = readmeContents.replace(regex, this.stringBuilder(repoUrl, this.flags.deployer.toString(), false));
        } else {
            // add code for button at top of repo
            readmeContents = `
${this.stringBuilder(repoUrl, this.flags.deployer.toString(), true)}
${readmeContents}`;
        }
        await fs.writeFile('README.md', readmeContents);
    }

    private stringBuilder = (repository: string, deployerURL: string, full: boolean) => {
        if (full) {
            return `
${startText}
[![Deploy](${this.flags.button})](${deployerURL}launch?template=${repository}) <${repository}>
${stopText}
`;
        }
        return `
[![Deploy](${this.flags.button})](${deployerURL}launch?template=${repository}) <${repository}>
`;
    };
}
