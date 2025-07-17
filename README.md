# LaunchPad for MIE

This GitHub action utilizes MIE's open source cluster to manage LXC containers derived from your github repository source code.

> **Note**: This project is new and is in a early version. There are likely bugs. If you encounter any, please create an issue.

## Table of Contents


## Prerequisites
- Valid Proxmox Account at [https://opensource.mieweb.org:8006](https://opensource.mieweb.org:8006).
- A public repository housed on mieweb (This organization has access to our self-hosted runner).

## Getting Started

To use this action in your repository, you need to add the following trigger events in a workflow file:

```yaml
on:
  push:
    branches: ["**"]
  create:
  delete:
```

This allows a container to be created/updated on a push command, created when a new branch is created, and deleted when a branch is deleted (like in the case of an accepted PR).

### Workflow Job

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

### Self-Hosted Runner

As mentioned in [Prequisites](#prerequisites), this workflow must run on MIE's own self-hosted runner. Using a runner supplied by Github will not work (at least for now).

## Configurations

At the very minimum, nine configuration settings are required to create any container. Some of these are supplied by Github. With all of these properties specified, you can create an empty container for a branch.

### Basic Properties

| Propety | Required? | Description | Supplied by Github? |
| ---------------- | ------ | ---------------------------------------------- | ------ |
| `github_event_name` | Yes | The name of the event that triggered the workflow to run. This can either be `push`, `create`, or `delete`. | `${{ github.event_name }}`
| `github_repository` | Yes | The name of the event that triggered the workflow to run. This can either be `push`, `create`, or `delete` | `${{ github.event.repository.name }}`
| `github_repository_owner` | Yes | The owner of the github repository the workflow is being ran in. | `${{ github.repository_owner }}`
| `github_ref_name` | Yes | The origin (branch) where the workflow is being ran. | `${{ github.event.ref }}`
| `proxmox_username` | Yes | Your proxmox username assigned to you. | N/A
| `proxmox_password` | Yes | Your proxmox password assigned to you. | N/A
| `container_password` | Yes |  The password for your container. **NOTE**: This should be different from your account password. Your Proxmox account can manage multiple containers, each of which have their own, unique, password. | N/A
| `http_port` | Yes | The HTTP Port for your container to listen on. It must be between `80` and `60000`. | N/A
| `linux_distribution` | Yes | The Linux Distribution that runs on your container. Currently, `rocky` (Rocky 9.5) and `debian` (Debian 12) are available. | N/A


There are a few other properties that are not required, but can still be specified in the workflow file:
<br>

| Propety | Required? | Description | Supplied by Github? |
| --------- | ----- |  ------------------------------------ | ------ |
| `public_key` | No | Your machine's public key that will be stored in the `~/.ssh/authorized_keys` file of your repository. This allows you to SSH into your container without a password. It is more secure and recommended. | N/A
| `deploy_on_start` | No | Can be either `y` or `n`. When set to `y`, the action will *attempt* to automatically deploy your github repository to your container. See [Automatic Deployment Properties](#automatic-deployment-properties) for more information.| N/A

> **NOTE**: If `deploy_on_start` is set to `y`, you must reference [Automatic Deployment Properties](#automatic-deployment-properties) for your project to deploy correctly.

### Automatic Deployment Properties

If `deploy_on_start` is set to `y`, this github action will *attempt* to automatically deploy services on your container. This is done by fetching your repository contents on the branch that the script is being ran in, installing dependencies/services, and running build and start commands in the background.

Additionally, with automatic deployment enabled, your container will update on every push command automatically, preventing you from having to SSH into the container and setting it up manually.

> **NOTE**: Properties below that are required assume `deploy_on_start` is set to `y`. If not, none of these properties are needed.

| Propety | Required? | Description |
| --------- | ----- |  ------------------------------------ |
| `project_root` | No | The root directory of your project to deploy from. Example: `/flask-server`. If the root directory is the same as the github root directory, leave blank.
| `require_env_vars` | No | Set `y` to copy environment variables to your container. See `container_env_vars` property for more information.
| `require_services` | No | Set `y` to specify services to install system-wide in your container. See `services` and `custom_services` properties for more information.
| `services` | No | A JSON array of services to add to your container. Example: ```services: '["mongodb", "docker"]'```. These services will automatically install and start up on container creation. **NOTE**: All services in this list must belong on the list of available services below. If you need a service that is not on the list, see `custom_services`.<br><br> Available Services: `meteor`, `mongodb`, `docker`, `redis`, `postgresql`, `apache`, `nginx`, `rabbitmq`, `memcached`, `mariadb`.
| `custom_services` | No | A 2D JSON array of custom service installation commands to install any custom service(s) not in `services`.<br> <br>Example: ```custom_services: [["sudo apt-get install -y service", "sudo systemctl enable service", "sudo systemctl start service"], ["sudo apt-get install -y service2", "sudo systemctl enable service2", "sudo systemctl start service2"]]```
| `multi_component` | No | Set to `y` if your application is multi-component, meaning more than one service must run concurrently. See the paragraph below for more information.

There are two types of deployments: single component and multi-component deployment. Single component deployment involves deploying only a single service (i.e. a single Flask Server, REACT application, MCP Server, etc.). Multi-component deployment involves deploying more than one service at the same time (i.e. a flask backend and a vite.js backend).

> **Important**: In Multi-Component applications, each top-layer key represents the file path, relative to the root directory, to the component (service) to place those variables/commands in. 

| Propety | Required? | Description | Single Component | Multi-Component |
| --------- | ----- |  ------------------------------------ | ---- | --- |
|  `container_env_vars` | Conditional on `require_env_vars` being `y`. | Key-Value Environment variable pairs. | Dictionary in the form of: `{ "api_key": "123", "password": "abc"}` | Dictionary in the form of: `'{"/frontend": { "api_key": "123"}, "/backend": { "password": "abc123" }}'`.
|  `install_command` | Yes | Commands to install all project dependencies | String of the installation command, i.e. `npm install`. | Dictionary in the form of: `'{"/frontend": "npm install", "/backend": "pip install -r ../requirements.txt"}'`.
|  `build_command` | No | Commands to build project components | String of the build command, i.e. `npm build`. | Dictionary in the form of: `'{"/frontend": "npm build", "/backend": "python3 build.py"}'`.
|  `start_command` | Yes | Commands to start project components. | String of the start command, i.e. `npm run`. | Dictionary in the form of: `'{"/frontend": "npm run", "/backend": "flask run"}'`.
|  `runtime_language` | Yes | Runtime language of each project component, which can either be `nodejs` or `python`. | String of runtime environment, i.e. `nodejs` | Dictionary in the form of: `'{"/frontend": "nodejs", "/backend": "python"}'`.
|  `root_start_command` | No | Command to run at the project directory root for **multi-component applications**. | N/A | String of the command, i.e. `Docker run`

## Important Notes for Automatic Deployment

Below are some important things to keep in mind if you want your application to be automatically deployed:
- If you are using meteor, you must start your application with the flag ``--alow-superuser``.
- When running a service, ensure it is listening on `0.0.0.0` (your IP) instead of only locally at `127.0.0.1`.
- The Github action will fail with an exit code and message if a property is not set up correctly.


## Output

When a container is successfully created (Github Action is successful), you will see an output with all of your container details. This includes all your ports, container ID, container IP Address (internal in 10.15.x.x subnet), public domain name, and ssh command to access your container.

See an example output below:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔔  COPY THESE PORTS DOWN — For External Access
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌  Note: Your container listens on SSH Port 22 internally,
    but EXTERNAL traffic must use the SSH port listed below:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Hostname Registration: polyglot-test-maxklema-main → 10.15.27.151
🔐  SSH Port            : 2355
🌐  HTTP Port           : 32000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦  Container ID        : 120
🌐  Internal IP         : 10.15.27.151
🔗  Domain Name         : https://polyglot-test-maxklema-main.opensource.mieweb.org
🛠️  SSH Access          : ssh -p 2355 root@polyglot-test-maxklema-main.opensource.mieweb.org
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```




## Misc.
Feel free to submit a PR/issue here or in [opensource-server](https://github.com/mieweb/opensource-server).
Author: [@maxklema](https://github.com/maxklema)