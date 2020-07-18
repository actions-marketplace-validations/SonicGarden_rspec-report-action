import * as core from '@actions/core'
import * as github from '@actions/github'
import markdownTable from 'markdown-table'
import replaceComment, {deleteComment} from '@aki77/actions-replace-comment'
import {parse, FailureResult} from './parse'

const TITLE = '# :cold_sweat: RSpec failure'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const commentGeneralOptions = () => {
  const pullRequestId = github.context.issue.number
  if (!pullRequestId) {
    throw new Error('Cannot find the PR id.')
  }

  return {
    token: core.getInput('token', {required: true}),
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: pullRequestId
  }
}

const example2Table = (examples: FailureResult['examples']): string => {
  return markdownTable([
    ['Example', 'Description', 'Message'],
    ...examples.map(({example, description, message}) => [
      example,
      description,
      message
    ])
  ])
}

async function run(): Promise<void> {
  try {
    const jsonPath = core.getInput('json-path', {required: true})
    const result = parse(jsonPath)
    if (result.examples.length === 0) {
      await deleteComment({
        ...commentGeneralOptions(),
        body: TITLE,
        startsWith: true
      })
      core.info(result.summary)
      return
    }

    await replaceComment({
      ...commentGeneralOptions(),
      body: `${TITLE}
  <details>
  <summary>${result.summary}</summary>
  ${example2Table(result.examples)}
  </details>
  `
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
