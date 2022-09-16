import { getAllLabels, deleteLabel } from './client.js';
import core from '@actions/core';
import github from "@actions/github"

const main = async () => {
  const exclusions = core.getInput('exclusions').split(',');
  const filterRegexpInput = core.getInput('filter-regexp');
  const filterRegexp = new RegExp(filterRegexpInput);

  var allLabels = await getAllLabels(github.context.owner, github.context.repo);
  var labelsToDelete = allLabels
    .filter(c => c.issues.totalCount == 0 && c.pullRequests.totalCount == 0)
    .filter(c => exclusions === undefined || !exclusions.includes(c.name))
    .filter(c => filterRegexp.test(c.name));

  for (const label of labelsToDelete) {
    console.info(`removing label "${label.name}": no usages`);
    await deleteLabel(label.id);
  }
};

const executeWithExceptionHandling = async () => {
  try {
    await main();
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

executeWithExceptionHandling();

