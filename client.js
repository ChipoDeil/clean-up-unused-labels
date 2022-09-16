import core from '@actions/core';
import github from '@actions/github';

const token = core.getInput('token');
const octokit = new github.getOctokit(token);

const getAllLabelsQuery = `query GetAllLabels($name: String!, $owner: String!, $after: String, $first:Int!){
    repository(name: $name, owner: $owner) {
      labels(first: $first, after: $after) {
        pageInfo{
            endCursor
        },
        totalCount,
        nodes {
          id,
          name,
          issues {
            totalCount
          }
          pullRequests {
            totalCount
          }
        }
      }
    }
  }`;

const deleteLabelMutation = `mutation DeleteLabel($id: ID!) {
    deleteLabel(input: {id: $id}){
        clientMutationId
    }
}`;

export const deleteLabel = async (labelId) => {
    return await octokit.graphql(deleteLabelMutation, {
        id: labelId,
        headers: {
            Accept: "application/vnd.github.bane-preview+json",
        }
    });
}

export const getAllLabels = async (repositoryName, repositoryOwner, after) => {
    const basicPagination = 100;

    const result = await octokit.graphql(getAllLabelsQuery, {
        name: repositoryName,
        owner: repositoryOwner,
        first: basicPagination,
        after: after
    });

    var labelsNode = result.repository.labels;

    if (labelsNode.totalCount < basicPagination)
        return labelsNode.nodes;

    const nextCursor = labelsNode.pageInfo.endCursor;

    if (nextCursor === null) return labelsNode.nodes;

    var nextLabels = await getAllLabels(repositoryName, repositoryOwner, nextCursor);

    return labelsNode.nodes.concat(nextLabels);
}