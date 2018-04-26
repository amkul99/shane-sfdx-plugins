import { expect, test } from '@salesforce/command/dist/test';
import fs = require('fs-extra');
import util = require('util');
import xml2js = require('xml2js');


const exec = util.promisify(require('child_process').exec);

const testProjectName = 'testProject';
const api = 'Platypus__b';
const label = 'Platypus';
const plural = 'Platypi';

before(async () => {
	await exec(`rm -rf ${testProjectName}`);
	await exec(`sfdx force:project:create -n ${testProjectName}`);
});

describe('shane:object:create (big object flavor)', () => {

	it('creates a big object with all params supplied', async () => {

		// `sfdx shane:object:create --label "Platypus" --plural "${plural}" --api Platypus__b --directory /my / project / path

		await exec(`sfdx shane:object:create --label "${label}" --plural "${plural}" --api ${api}`, { cwd: testProjectName });
		expect(fs.existsSync(`${testProjectName}/force-app/main/default/objects/${api}`)).to.be.true;
		expect(fs.existsSync(`${testProjectName}/force-app/main/default/objects/${api}/fields`)).to.be.true;
		expect(fs.existsSync(`${testProjectName}/force-app/main/default/objects/${api}/${api}.object-meta.xml`)).to.be.true;

		const parsed = await getParsedXML(`${testProjectName}/force-app/main/default/objects/${api}/${api}.object-meta.xml`);

		expect(parsed.CustomObject).to.be.an('object');
		expect(parsed.CustomObject.deploymentStatus).to.equal('Deployed');
		expect(parsed.CustomObject.label).to.equal(label);
		expect(parsed.CustomObject.pluralLabel).to.equal(plural);
		expect(parsed.CustomObject.indexes).to.be.an('object');
		expect(parsed.CustomObject.indexes.fullName).to.equal(`${label}Index`);
		expect(parsed.CustomObject.indexes.label).to.equal(`${label} Index`);
	}).timeout(60000);

	it('creates a non indexed Text field on the Big Object', async () => {

		const fieldAPI = 'Non_Indexed_Field__c';
		const fieldLabel = 'My Text Field';

		await exec(`sfdx shane:object:field --object ${api} --api ${fieldAPI} -l 255 -n "${fieldLabel}" -t Text  --noIndex`, { cwd: testProjectName });
		expect(fs.existsSync(`${testProjectName}/force-app/main/default/objects/${api}/fields/${fieldAPI}.field-meta.xml`)).to.be.true;

		const parsed = await getParsedXML(`${testProjectName}/force-app/main/default/objects/${api}/fields/${fieldAPI}.field-meta.xml`);

		expect(parsed.CustomField).to.be.an('object');
		expect(parsed.CustomField.type).to.equal('Text');
		expect(parsed.CustomField.label).to.equal(fieldLabel);
		expect(parsed.CustomField.fullName).to.equal(fieldAPI);
		expect(parsed.CustomField.length).to.equal('255');

		const parsedObj = await getParsedXML(`${testProjectName}/force-app/main/default/objects/${api}/${api}.object-meta.xml`);

		// verify indexing didn't happen
		expect(parsedObj.CustomObject.indexes.fields).to.be.undefined;

	}).timeout(60000);

	it('creates a non indexed Number field (18,0) on the Big Object', async () => {

		const fieldAPI = 'Number_Field__c';
		const fieldLabel = 'Number Field';

		await exec(`sfdx shane:object:field --object ${api} --api ${fieldAPI} -n "${fieldLabel}" -t Number  --noIndex --scale 0 --precision 18`, { cwd: testProjectName });
		expect(fs.existsSync(`${testProjectName}/force-app/main/default/objects/${api}/fields/${fieldAPI}.field-meta.xml`)).to.be.true;

		const parsed = await getParsedXML(`${testProjectName}/force-app/main/default/objects/${api}/fields/${fieldAPI}.field-meta.xml`);

		expect(parsed.CustomField).to.be.an('object');
		expect(parsed.CustomField.type).to.equal('Number');
		expect(parsed.CustomField.label).to.equal(fieldLabel);
		expect(parsed.CustomField.fullName).to.equal(fieldAPI);
		expect(parsed.CustomField.precision).to.equal('18');
		expect(parsed.CustomField.scale).to.equal('0');

		const parsedObj = await getParsedXML(`${testProjectName}/force-app/main/default/objects/${api}/${api}.object-meta.xml`);

		// verify indexing didn't happen
		expect(parsedObj.CustomObject.indexes.fields).to.be.undefined;

	}).timeout(60000);

	it('creates a required non indexed Text field on the Big Object', async () => {

		const fieldAPI = 'Required_Non_Indexed_Field__c';
		const fieldLabel = 'My Required Text Field';

		await exec(`sfdx shane:object:field --object ${api} --api ${fieldAPI} -l 255 -n "${fieldLabel}" -t Text  --noIndex --required`, { cwd: testProjectName });
		expect(fs.existsSync(`${testProjectName}/force-app/main/default/objects/${api}/fields/${fieldAPI}.field-meta.xml`)).to.be.true;

		const parsed = await getParsedXML(`${testProjectName}/force-app/main/default/objects/${api}/fields/${fieldAPI}.field-meta.xml`);

		expect(parsed.CustomField).to.be.an('object');
		expect(parsed.CustomField.type).to.equal('Text');
		expect(parsed.CustomField.label).to.equal(fieldLabel);
		expect(parsed.CustomField.required).to.equal('true');
		expect(parsed.CustomField.fullName).to.equal(fieldAPI);
		expect(parsed.CustomField.length).to.equal('255');

		const parsedObj = await getParsedXML(`${testProjectName}/force-app/main/default/objects/${api}/${api}.object-meta.xml`);

		// verify indexing didn't happen
		expect(parsedObj.CustomObject.indexes.fields).to.be.undefined;

	}).timeout(60000);

	it('creates a indexed Text field on the Big Object', async () => {

		const fieldAPI = 'Indexed_Field__c';
		const fieldLabel = 'My Indexed Text Field';

		await exec(`sfdx shane:object:field --object ${api} --api ${fieldAPI} -l 10 -n "${fieldLabel}" -t Text  --indexAppend --indexDirection DESC`, { cwd: testProjectName });
		expect(fs.existsSync(`${testProjectName}/force-app/main/default/objects/${api}/fields/${fieldAPI}.field-meta.xml`)).to.be.true;

		const parsed = await getParsedXML(`${testProjectName}/force-app/main/default/objects/${api}/fields/${fieldAPI}.field-meta.xml`);

		expect(parsed.CustomField).to.be.an('object');
		expect(parsed.CustomField.type).to.equal('Text');
		expect(parsed.CustomField.label).to.equal(fieldLabel);
		expect(parsed.CustomField.fullName).to.equal(fieldAPI);
		expect(parsed.CustomField.length).to.equal('10');

		const parsedObj = await getParsedXML(`${testProjectName}/force-app/main/default/objects/${api}/${api}.object-meta.xml`);

		// verify indexing didn't happen
		expect(parsedObj.CustomObject.indexes.fields).to.be.an('object');
		// expect(parsedObj.CustomObject.indexes.fields.length).to.equal(1);
		expect(parsedObj.CustomObject.indexes.fields.name).to.equal(fieldAPI);
		expect(parsedObj.CustomObject.indexes.fields.sortDirection).to.equal('DESC');

	}).timeout(60000);

	it('appends a second indexed Text field on the Big Object', async () => {

		const fieldAPI = 'Indexed_Field2__c';
		const fieldLabel = 'My Indexed Text Field 2';

		await exec(`sfdx shane:object:field --object ${api} --api ${fieldAPI} -l 10 -n "${fieldLabel}" -t Text  --indexAppend --indexDirection ASC`, { cwd: testProjectName });
		expect(fs.existsSync(`${testProjectName}/force-app/main/default/objects/${api}/fields/${fieldAPI}.field-meta.xml`)).to.be.true;

		const parsed = await getParsedXML(`${testProjectName}/force-app/main/default/objects/${api}/fields/${fieldAPI}.field-meta.xml`);

		expect(parsed.CustomField).to.be.an('object');
		expect(parsed.CustomField.type).to.equal('Text');
		expect(parsed.CustomField.label).to.equal(fieldLabel);
		expect(parsed.CustomField.fullName).to.equal(fieldAPI);
		expect(parsed.CustomField.length).to.equal('10');

		const parsedObj = await getParsedXML(`${testProjectName}/force-app/main/default/objects/${api}/${api}.object-meta.xml`);

		// verify indexing didn't happen
		expect(parsedObj.CustomObject.indexes.fields).to.be.an('array');
		expect(parsedObj.CustomObject.indexes.fields.length).to.equal(2);
		expect(parsedObj.CustomObject.indexes.fields[1].name).to.equal(fieldAPI);
		expect(parsedObj.CustomObject.indexes.fields[1].sortDirection).to.equal('ASC');

	}).timeout(60000);

	it('adds a third indexed Text field on the Big Object in position 1', async () => {

		const fieldAPI = 'Indexed_Field3__c';
		const fieldLabel = 'My Indexed Text Field 3';

		await exec(`sfdx shane:object:field --object ${api} --api ${fieldAPI} -l 10 -n "${fieldLabel}" -t Text  --indexPosition 1 --indexDirection ASC`, { cwd: testProjectName });
		expect(fs.existsSync(`${testProjectName}/force-app/main/default/objects/${api}/fields/${fieldAPI}.field-meta.xml`)).to.be.true;

		const parsed = await getParsedXML(`${testProjectName}/force-app/main/default/objects/${api}/fields/${fieldAPI}.field-meta.xml`);

		expect(parsed.CustomField).to.be.an('object');
		expect(parsed.CustomField.type).to.equal('Text');
		expect(parsed.CustomField.label).to.equal(fieldLabel);
		expect(parsed.CustomField.fullName).to.equal(fieldAPI);
		expect(parsed.CustomField.length).to.equal('10');

		const parsedObj = await getParsedXML(`${testProjectName}/force-app/main/default/objects/${api}/${api}.object-meta.xml`);

		// verify indexing didn't happen
		expect(parsedObj.CustomObject.indexes.fields).to.be.an('array');
		expect(parsedObj.CustomObject.indexes.fields.length).to.equal(3);
		expect(parsedObj.CustomObject.indexes.fields[1].name).to.equal(fieldAPI);
		expect(parsedObj.CustomObject.indexes.fields[1].sortDirection).to.equal('ASC');

	}).timeout(60000);

	it('creates a big object with all params supplied in separate dir', async () => {

		// `sfdx shane:object:create --label "Platypus" --plural "${plural}" --api Platypus__b --directory /my / project / path
		const myDir = 'myDir';

		fs.ensureDirSync(`${testProjectName}/${myDir}`);

		await exec(`sfdx shane:object:create --label "${label}" --plural "${plural}" --api ${api} --directory ${myDir}`, { cwd: testProjectName });
		expect(fs.existsSync(`${testProjectName}/${myDir}/objects/${api}`)).to.be.true;
		expect(fs.existsSync(`${testProjectName}/${myDir}/objects/${api}/fields`)).to.be.true;
		expect(fs.existsSync(`${testProjectName}/${myDir}/objects/${api}/${api}.object-meta.xml`)).to.be.true;

	}).timeout(60000);

	it('can build a permset', async () => {
		const permSetName = 'MyPermSet1';
		const permResult = await exec(`sfdx shane:permset:create -n ${permSetName} -o ${api}` , { cwd: testProjectName });

		expect(fs.existsSync(`${testProjectName}/force-app/main/default/permissionsets`)).to.be.true;
		expect(fs.existsSync(`${testProjectName}/force-app/main/default/permissionsets/${permSetName}.permissionset-meta.xml`)).to.be.true;

		// parse the permset
		const parsed = await getParsedXML(`${testProjectName}/force-app/main/default/permissionsets/${permSetName}.permissionset-meta.xml`);

		//verify object
		expect(parsed.PermissionSet).to.be.an('object');
		expect(parsed.PermissionSet.objectPermissions).to.be.an('object');
		expect(parsed.PermissionSet.objectPermissions.object).to.equal(api);

		expect(parsed.PermissionSet.fieldPermissions).to.be.an('array');
		expect(parsed.PermissionSet.fieldPermissions.length).to.equal(2);

		//verify all the fields so far.  Required fields, and fileds required because they're indexed, shouldn't be included

		expect(parsed.PermissionSet.fieldPermissions).to.deep.include({ readable: 'true', editable: 'true', field: `${api}.Non_Indexed_Field__c` });
		expect(parsed.PermissionSet.fieldPermissions).to.deep.include({ readable: 'true', editable: 'true', field: `${api}.Number_Field__c` });

		expect(parsed.PermissionSet.fieldPermissions).to.not.include({ readable: 'true', editable: 'true', field: `${api}.Indexed_Field3__c` });
		expect(parsed.PermissionSet.fieldPermissions).to.not.include({ readable: 'true', editable: 'true', field: `${api}.Indexed_Field2__c` });
		expect(parsed.PermissionSet.fieldPermissions).to.not.include({ readable: 'true', editable: 'true', field: `${api}.Indexed_Field__c` });
		expect(parsed.PermissionSet.fieldPermissions).to.not.include({ readable: 'true', editable: 'true', field: `${api}.Required_Non_Indexed_Field__c` });


	}).timeout(60000);

	it('all this actually deploys as valid code!', async () => {
		// create org
		await exec(`sfdx force:org:create -f config/project-scratch-def.json -s -a PluginMochaTesting`, { cwd: testProjectName });

		// push source
		const pushResult = await exec(`sfdx force:source:push --json`, { cwd: testProjectName });

		expect(pushResult.stderr).to.equal('');
		const result = JSON.parse(pushResult.stdout);

		expect(result.status).to.equal(0);
		// destroy org
		await exec(`sfdx shane:org:delete`, { cwd: testProjectName });

	}).timeout(60000);

});

after(async () => {
	await exec(`rm -rf ${testProjectName}`);
});


async function getParsedXML(url: string){
	const xml = await fs.readFile(url);

	const parser = new xml2js.Parser({ explicitArray: false });
	const parseString = util.promisify(parser.parseString);
	const parsed = await parseString(xml);

	return parsed;
}
