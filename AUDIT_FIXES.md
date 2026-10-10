# Scoped Drive image proxy

Repair branch: `fix/internship-audit-20261010`. Changes are scoped to audit findings; no deployment or live provider action is included.

## Changed

Image retrieval requires CATALOGUE_IMAGE_FOLDER_ID in Apps Script properties, verifies direct folder membership, permits only supported image MIME types and limits responses to 2 MB. Arbitrary Drive IDs and non-image files fail closed.

## Verification

`node --test tests/image-proxy.test.cjs`

Commands are entry points, not a claim that every live integration was executed. See the repair bundle for actual results.

## Setup and remaining evidence

Use a dedicated catalogue-image folder and set its ID in Script Properties before deployment. Files served through this web app are accessible to its visitors; do not put sensitive images in that folder. VM tests mock the Google API boundary. Apps Script authorization/deployment and actual Drive retrieval must be verified in your account.
