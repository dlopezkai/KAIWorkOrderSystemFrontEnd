export default defineEventHandler(async(event) => {
  // fetch all comments for a specific work order

  const runtimeConfig = useRuntimeConfig()
  const params = getQuery(event)
  console.log('params', params)

  const response = await fetch(`${runtimeConfig.API_URL}/task/${params.taskid}/comments`)

  const data = await response.json()

  return {
    data
  }
});