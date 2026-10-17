# Branch Policy Contract

Central reusable policy for the branch and environment rules used by generated
customer workflows.

Coverage is one threshold on every branch: `coverage-threshold` equals
`base-coverage-threshold` on dev, uat and main. uat and main used to add 10
points (capped at 95), which failed on promotion the same code that had passed
dev. uat and main stay strict otherwise: `fail-on-warning` and
`sonar-gate-wait` are `true` there and `false` elsewhere.
