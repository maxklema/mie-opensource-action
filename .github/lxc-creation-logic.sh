#!/bin/bash
# Last Modified on July 13th, 2025 by Maxwell Klema
# ------------------------------

# check if container exists

set +e
ssh -i ~/.ssh/id_rsa -o SendEnv="PROXMOX_USERNAME PROXMOX_PASSWORD CONTAINER_NAME" container-exists@10.15.0.4
CONTAINER_EXISTS=$?
if [ $CONTAINER_EXISTS -eq 0 ] || [ $CONTAINER_EXISTS -eq 2 ] ; then
    echo "Container \"$CONTAINER_NAME\" already found with this name. Cannot create container on this branch."
    if [ ! $GITHUB_EVENT == 'push' ]; then
        exit 1
    fi
elif [ $CONTAINER_EXISTS -eq 1 ]; then
    echo "Container \"$CONTAINER_NAME\" Not Found. Creating Container based on $PROJECT_BRANCH branch."
    
    # continue if an exit code error in remote container creation script
    set +e

    TMP_OUTPUT=$(mktemp)
    ssh -i ~/.ssh/id_rsa \
    -o SendEnv="CONTAINER_NAME CONTAINER_PASSWORD PROXMOX_USERNAME PROXMOX_PASSWORD HTTP_PORT DEPLOY_ON_START PROJECT_REPOSITORY PROJECT_BRANCH PROJECT_ROOT REQUIRE_ENV_VARS CONTAINER_ENV_VARS INSTALL_COMMAND START_COMMAND RUNTIME_LANGUAGE REQUIRE_SERVICES SERVICES CUSTOM_SERVICES" \
    create-container@10.15.0.4 | tee "$TMP_OUTPUT"
    
    OUTPUT=$(cat "$TMP_OUTPUT")
    rm "$TMP_OUTPUT"
    echo "CONTAINER_CREATED=true" >> $GITHUB_OUTPUT

    exit $?
fi