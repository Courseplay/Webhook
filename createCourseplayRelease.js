// Webhook for the Courseplay GitHub repository.
// 
// On each commit create a deployable Courseplay zip file and
// upload it to GitHub as a release.
//
const secret = process.env.SECRET
const token = process.env.TOKEN

const owner = 'Courseplay';
const repo = 'courseplay';


const Octokit = require('@octokit/rest');
const octokit = new Octokit({auth: 'token ' + token});

const WebhooksApi = require('@octokit/webhooks')
const webhooks = new WebhooksApi({secret: secret })

const http = require('http');
const execSync = require('child_process').execSync;

const fs = require('fs')

async function createRelease(tag, name, description, sha, filename) {
	let result = await octokit.repos.createRelease({
		owner: owner,
		repo: repo,
		tag_name: tag,
		//	draft : true,
		prerelease: false,
		name: name,
		body: description,
		target_commitish: sha
	});

	const stats = fs.statSync('/tmp/' + filename);

 	result = await octokit.repos.uploadReleaseAsset({
		url : result.data.upload_url,
		headers: {
			'content-length' : stats.size,
			'content-type' : 'application/zip'
		},
		file: fs.readFileSync('/tmp/' + filename),
		name: filename
		})
	
	console.log(result)
}

webhooks.on('push', ({name, payload}) => {
    console.log(name, payload);

    let branch = payload.ref.replace('refs/heads/', '')

    if (branch !== 'master') {
    	console.log('Not creating release from ' + payload.ref);
		return;
    }

    console.log('Push event for ' + payload.ref);

    execSync(__dirname + '/packCourseplay ' + branch + ' ' + __dirname + '/exclude.lst');

    fs.readFile('/tmp/courseplay_version', (err, data) => { 
	if (err) throw err;

	const courseplayVersion = data.toString().replace(/^\s+|\s+$/g, ''); //remove newlines

	fs.readFile('/tmp/courseplay_filename', (err, data) => {
		if (err) throw err;

		const courseplayFilename = data.toString().replace(/^\s+|\s+$/g, ''); //remove newlines

		console.log('Creating release ' + courseplayVersion); 
		createRelease(courseplayVersion, 'Courseplay for FS19 v' + courseplayVersion, payload.head_commit.message, payload.head_commit.id, courseplayFilename);
	})
    })   
})

http.createServer(webhooks.middleware).listen(8080);

