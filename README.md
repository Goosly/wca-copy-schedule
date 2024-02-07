# WCA-copy-schedule

# Development

To run locally:
> npm run start

To deploy, there is a weird issue with the base href (to investigate/fix):

> npm run build-prod

Change index.html:
<base href="https://goosly.github.io/wca-copy-schedule/">

> ngh --dir=dist/wca-copy-schedule
