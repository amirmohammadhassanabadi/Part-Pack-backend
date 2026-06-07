#!/bin/sh
set -eu

test -n "${INFRA_TRIGGER_TOKEN:-}" || {
  echo "ERROR: INFRA_TRIGGER_TOKEN is empty"
  exit 1
}

echo "Triggering infra pipeline for service: $DEPLOY_SERVICE"

curl --fail-with-body --show-error --request POST \
  --form "token=$INFRA_TRIGGER_TOKEN" \
  --form "ref=$INFRA_REF" \
  --form "variables[DEPLOY_SERVICE]=$DEPLOY_SERVICE" \
  "$GITLAB_API_URL/projects/$INFRA_PROJECT_ID/trigger/pipeline"