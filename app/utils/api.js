import React from 'react';
import * as config from '../conf';

/**
 * @return the http headers for calling Github
 */
export const makeGithubFetchRequest = (additionalHeaders, cors, transactionId) => {
  let request = {
    method: 'GET',
    headers: {
      "User-Agent": "Spring Cloud Config Inspector Proxy",
      "tid": transactionId
    }
  };

  if (additionalHeaders) {
    Object.assign(request.headers, additionalHeaders);
  }

  // To send cookies to the destination (Intuit authentication)
  // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters
  if (cors) {
    // Update the request object with the CORS and Cookies settings
    Object.assign(request, {
      mode: 'cors',
      credentials: 'include',
    })

  } else if (config.GIT_REPOS_API_TOKEN) {
    // Add the authorization header for standalone version
    Object.assign(request.headers, {
      "authorization": `token ${config.GIT_REPOS_API_TOKEN}`
    })
  }
  return request;
}

/**
 * Parse files returned from profiles GitHub request. If a profile does not
 * exist, add with warning label.
 *
 * @param {object[]} contents - GitHub v3 contents response
 * @param {string} appName - current app
 * @param {string[]} profiles - list of profiles to check against result
 * @param {function} stateHandler - stateHandler function
 * @param {string} githubApiUrl - url used in request, passed to stateHandler
 * @returns {object[]} options for a profiles dropdown
 */
export const parseProfiles = (contents, appName, profiles,
  stateHandler, githubApiUrl) => {
  // The contents include the name of the files from github.
  const files = contents.filter(c => c.name.startsWith(`${appName}-`) ||
    c.name.startsWith('application-'))
  console.log(`Loaded the config files from github for this app ${JSON.stringify(files.map(c => c.name))}`)

  stateHandler({phase: "profiles", type: "files", url: githubApiUrl,
    value: files});

  const profileNames = files.map(f => {
    let profile = f.name.substring(
      f.name.indexOf(`-`) + 1,
      f.name.lastIndexOf('.')
    )
    return profile
  })
  profileNames.push('default')
  console.log(`Parsed the profile names from config files ${JSON.stringify(profileNames)}`)

  stateHandler({phase: "profiles", type: "names", url: githubApiUrl,
    value: profiles});

  // Build the options for the dropdown.
  const profOptions = []
  profileNames.forEach((p, index) => {
    if (profileNames.indexOf(p) === index) {
      profOptions.push({text: p, value: p})
    }
  })

  // Display the profiles on the list.
  let label = { color:'red', content:'Not found' }
  profiles.forEach(profile => {
    if (!profileNames.includes(profile)) {
      profOptions.push({text:profile, value:profile, label})
    }
  })

  // Sort the labels by the names, case insensitive
  // https://stackoverflow.com/questions/979256/sorting-an-array-of-javascript-objects/979289#979289
  return profOptions.sort((a, b) => a.text.localeCompare(b.text))
}
