// .github/scripts/comment-container-details.js
const { Octokit } = require("@octokit/rest");

const {
    GITHUB_TOKEN,
    GITHUB_REPOSITORY,
    GITHUB_PR_NUMBER,
    EXIT_STATUS,
    DOMAIN_NAME,
    SSH_COMMAND,
    INTERNAL_IP,
    CONTAINER_ID,
} = process.env;

const [owner, repo] = GITHUB_REPOSITORY.split("/");
const octokit = new Octokit({ auth: GITHUB_TOKEN });

let comment = "";
let failReason = "";

switch (EXIT_STATUS) {
    case "0":
        comment = `
            🚀 **Container Deployed for this PR**

            Congratulations! This PR has been deployed to a live container on MIE's Proxmox Cluster.

            🔗 **Domain**: ${DOMAIN_NAME}
            🛠️ **SSH Access**: ${SSH_COMMAND}
            🌐 **Internal IP**: ${INTERNAL_IP}
            📦 **Container ID**: ${CONTAINER_ID}

            > To view container metrics, visit [https://opensource.mieweb.org:8006](https://opensource.mieweb.org:8006)
            <small>Note: Future commits to this PR will **<u>not be automatically</u>** updated on the container. This must be done manually.</small>
            `;
        break;
    case "2":
        failReason = `Invalid Proxmox Credentials. Make sure you specify the correct proxmox username and password.`;
        break;
    case "3":
        failReason = `Invalid Hostname. Either your hostname is already used by another container or it is ill-formatted. It must only container numbers, letters, and hyphens.`;
        break;
    case "4":
        failReason = `Invalid Password. Your password must be at least 8 characters.`;
        break;
    case "5":
        failReason = `Invalid Public Key. Your public key was not formatted correctly. If you do not wish to use a public key, you can remove the PUBLIC_KEY environment variable from the YAML file.`;
        break;
    case "6":
        failReason = `Invalid HTTP Port. You chose an invalid HTTP port. It must be between 80 and 9999.`;
        break;
}

if (EXIT_STATUS !== "0") {
    comment = `
    ❌ **Error: Container Deployed for this PR**

    Unfortunately, a container could not be created for this PR.

    **Reason**: ${failReason} Update your credentials and re-run the job.

    > <small>Note: Future commits to this PR will **<u>not be automatically</u>** updated on the container. This must be done manually.</small>
    `;
}

async function run() {
    await octokit.issues.createComment({
        owner,
        repo,
        issue_number: Number(GITHUB_PR_NUMBER),
        body: comment,
    });
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
