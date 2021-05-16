// Webhook for the Courseplay GitHub repository.
// 
// On each commit create a deployable Courseplay zip file and
// upload it to GitHub as a release.
//
const secret = process.env.SECRET
let privateKey = process.env.PRIVATE_KEY

const fs = require('fs')

try {
	privateKey = fs.readFileSync('courseplay-release-creator-private-key.pem')
	console.log('Read private key from file.')
} catch (e) {
	console.log('No private key file could be read')
}

const {App} =  require('@octokit/app')
const {createNodeMiddleware} =  require('@octokit/webhooks')
const app = new App({appId: "115455", privateKey: privateKey, webhooks: {secret}})

const http = require('http');
const execSync = require('child_process').execSync;

async function createRelease(octokit, tag, name, description, sha, filename) {
	let result = await octokit.request('POST /repos/Courseplay/courseplay/releases', {
		tag_name: tag,
		//	draft : true,
		prerelease: false,
		name: name,
		body: description,
		target_commitish: sha
	});

	const stats = fs.statSync('/tmp/' + filename);
	const zipFile = fs.readFileSync('/tmp/' + filename)

 	result = await octokit.request('POST ' + result.data.upload_url, {
		headers: {
			'content-length' : stats.size,
			'content-type' : 'application/zip'
		},
		data: zipFile,
		name: filename
		})
	
	console.log(result)
}

app.webhooks.on('push', ({octokit, payload}) => {
    let branch = payload.ref.replace('refs/heads/', '')

    console.log('Push event for ' + payload.ref);

    if (payload.repository.name !== 'courseplay') {
    	console.log('Not creating release for ' + payload.repository.name + ', only for courseplay')
		return
	}

    if (branch !== 'master') {
    	console.log('Not creating release from ' + payload.ref + ', only from master')
		return
    }

    execSync(__dirname + '/packCourseplay ' + branch + ' ' + __dirname + '/exclude.lst');

    fs.readFile('/tmp/courseplay_version', (err, data) => { 
		if (err) throw err;

		const courseplayVersion = data.toString().replace(/^\s+|\s+$/g, ''); //remove newlines

		fs.readFile('/tmp/courseplay_filename', (err, data) => {
			if (err) throw err;

			const courseplayFilename = data.toString().replace(/^\s+|\s+$/g, ''); //remove newlines

			console.log('Creating release ' + courseplayVersion);
			createRelease(octokit, courseplayVersion, 'Courseplay for FS19 v' + courseplayVersion,
				payload.head_commit.message, payload.head_commit.id, courseplayFilename)
				.then(() => {
					console.log('Release created')
				})
				.catch(e => {
					// most likely the release already exists, this was just a subsequent push to master
					console.log('Release not created, error: ' + e);
				});
		})
	})
})

http.createServer(createNodeMiddleware(app.webhooks)).listen(8080);

