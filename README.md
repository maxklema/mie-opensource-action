## LaunchPad for MIE

This GitHub action utilizes MIE's open source cluster to manage LXC containers derived from your github repository source code.

> **Note**: This project is new and is in a early version. There are likely bugs. If you encounter any, please create an issue.

### Table of Contents


### Prerequisites
- Valid Proxmox Account at [https://opensource.mieweb.org:8006](https://opensource.mieweb.org:8006).
- A public repository housed on mieweb (This organization has access to our self-hosted runner).

### Getting Started

To use this action in your repository, you need to add the following trigger events in a workflow file:

```yaml
on:
  push:
    branches: ["**"]
  create:
  delete:
```

This allows a container to be created/updated on a push command, created when a new branch is created, and deleted when a branch is deleted (like in the case of an accepted PR).

#### Workflow Job

The job in your workflow file should look similar to this:

```yaml
jobs:
  manage-container:
    runs-on: self-hosted
    if: github.event_name != 'push' || github.event.created == false
    steps:
      - uses: maxklema/mie-opensource-action@main
        with:
          github_event_name: ${{ github.event_name }}
          github_repository: ${{ github.event.repository.name }}
          github_repository_owner: ${{ github.repository_owner }}
          github_ref_name: ${{ github.event.ref }}
          proxmox_password: ${{ secrets.PROXMOX_PASSWORD }}
          proxmox_username: user
          container_password: ${{ secrets.CONTAINER_PASSWORD }}
          http_port: 32000
          public_key: ${{ secrets.PUBLIC_KEY }}
```

> **Note**: The conditional statement ensures that a container cannot be created <i>and</i> updated at the same time when creating a new branch, which can result in unexpected behavior.

#### Self-Hosted Runner

As mentioned in [Prequisites](#prerequisites), this workflow must run on MIE's own self-hosted runner. Using a runner supplied by Github will not work (at least for now).

### Configurations

At the very minimum, nine configuration settings are required to create any container. Some of these are supplied by Github. With all of these properties specified, you can create an empty container for a branch.

#### Basic Properties

| Propety | Required? | Type | Description | Supplied by Github? |
| --------- | ----- | ------ | ------------------------------------ | ------ |
| `github_event_name` | Yes | String | The name of the event that triggered the workflow to run. This can either be `push`, `create`, or `delete`. | `${{ github.event_name }}`
| `github_repository` | Yes | String | The name of the event that triggered the workflow to run. This can either be `push`, `create`, or `delete` | `${{ github.event.repository.name }}`
| `github_repository_owner` | Yes | String | The owner of the github repository the workflow is being ran in. | `${{ github.repository_owner }}`
| `github_ref_name` | Yes | String | The origin (branch) where the workflow is being ran. | `${{ github.event.ref }}`
| `proxmox_username` | Yes | String | Your proxmox username assigned to you. | N/A
| `proxmox_password` | Yes | String | Your proxmox password assigned to you. | N/A
| `container_password` | Yes | String | The password for your container. **NOTE**: This should be different from your account password. Your Proxmox account can manage multiple containers, each of which have their own, unique, password. | N/A
| `http_port` | Yes | Integer | The HTTP Port for your container to listen on. It must be between `80` and `60000`. | N/A
| `linux_distribution` | Yes | String | The Linux Distribution that runs on your container. Currently, `rocky` (Rocky 9.5) and `debian` (Debian 12) are available. | N/A


There are a few other properties that are not required, but can still be specified in the workflow file:
<br>

| Propety | Required? | Type | Description | Supplied by Github? |
| --------- | ----- | ------ | ------------------------------------ | ------ |
| `public_key` | No | String | Your machine's public key that will be stored in the `~/.ssh/authorized_keys` file of your repository. This allows you to SSH into your container without a password. It is more secure and recommended. | N/A
| `deploy_on_start` | No | String | Can be either `y` or `n`. When set to `y`, the action will *attempt* to automatically deploy your github repository to your container. See [Automatic Deployment Properties](#automatic-deployment-properties) for more information.| N/A

> **NOTE**: If `deploy_on_start` is set to `y`, you must reference [Automatic Deployment Properties](#automatic-deployment-properties) for your project to deploy correctly.

#### Automatic Deployment Properties

If `deploy_on_start` is set to `y`, this github action will *attempt* to automatically deploy services on your container. This is done by fetching your repository contents on the branch that the script is being ran in, installing dependencies/services, and running build and start commands in the background.

Additionally, with automatic deployment enabled, your container will update on every push command automatically, preventing you from having to SSH into the container and setting it up manually.

> **NOTE**: Properties below that are required assume `deploy_on_start` is set to `y`. If not, none of these properties are needed.





### Output



### Misc.
Feel free to submit a PR/issue here or in [opensource-server](https://github.com/mieweb/opensource-server).
Author: [@maxklema](https://github.com/maxklema)