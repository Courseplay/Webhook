## Building release is now a Github action (https://github.com/Courseplay/Courseplay_FS25/blob/main/.github/workflows/build-release.yml), this webhook is now obsolete. 

# Courseplay Release Creator

This is the Courseplay Release Creator GitHub app. It listens for push
events on the `courseplay` repository's `master` branch. 

If such an event is received, it starts the `packCourseplay` shell 
script to clone the `master` branch and creates a zip file called 
`FSxx_Courseplay.zip` from the contents of the Courseplay source 
directory, where `xx` is the version (19, 22 or 25) based on the repository received in the event.

Files matching the patterns in `exclude.lst` will not be included in
the zip.

Once the zip file is created, the app attempts to create a release 
on GitHub with the version number found in `modDesc.xml`. This will 
succeed only if no such release exist yet, so only the first push
with a different version will result in a new release. 

Subsequent pushes on `master` with the same release won't update an
existing release.

## Installation

Unpack or clone this on a Linux server. Make sure `node` and `npm` is 
installed. 

Change to the installation directory and install the dependencies with
`npm install`

## Running the App

The App uses a Webhook secret and a private key for authentication with
GitHub. You can enter/generate these at https://github.com/organizations/Courseplay/settings/apps/courseplay-release-creator.

Make sure the environment you run the App has the `SECRET` and `PRIVATE_KEY` 
variables set, the App uses these to get the Webhook secret and the 
private key. You can do this for instance in `.bashrc`:
```bash
export SECRET='your secret'
export PRIVATE_KEY='-----BEGIN RSA PRIVATE KEY-----
...
your private key here, on multiple lines
...
-----END RSA PRIVATE KEY-----'
```
Make sure you use single quotes around the private key to preserve the line breaks.

Now you can start the App with
```bash
nohup node createCourseplayRelease.js &
```

You can also set it up as a service, TODO for later...
