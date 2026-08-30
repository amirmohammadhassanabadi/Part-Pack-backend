#!/bin/sh
set -eu

test -n "${DEPLOYMENT_TRIGGER_TOKEN:-}" || {
  echo "ERROR: DEPLOYMENT_TRIGGER_TOKEN is empty"
  exit 1
}

echo "Triggering deployment pipeline for service: $DEPLOY_SERVICE"

curl --fail-with-body --show-error --request POST \
  --form "token=$DEPLOYMENT_TRIGGER_TOKEN" \
  --form "ref=$DEPLOYMENT_REF" \
  --form "variables[DEPLOY_SERVICE]=$DEPLOY_SERVICE" \
  "$GITLAB_API_URL/projects/$DEPLOYMENT_PROJECT_ID/trigger/pipeline"