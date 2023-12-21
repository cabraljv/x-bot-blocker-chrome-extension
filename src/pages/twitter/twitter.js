
const baseUrl = 'https://api.botblocker.cabraljv.dev'

class Storage{
  static async get_item(key){
    const result = await new Promise((resolve)=>{
      chrome.storage.local.get(key,(result) => {
        resolve(result[key])
      })
    })
    if(result){
      return JSON.parse(result)
    }

    return []
  }
  
  static async set_item(key,value){
    return await new Promise((resolve)=>{
      chrome.storage.local.set({[key]: value},() => {
        resolve()
      })
    })
  }

  async clear(){
    return await new Promise((resolve)=>{
      chrome.storage.local.clear(() => {
        resolve()
      })
    })
  }
}

async function main(){
  console.log('Carregou essa porra')

  const blockedAccountsResponse = await fetch(`${baseUrl}/static/blockedAccounts.json`)
  const blockedAccounts = await blockedAccountsResponse.json()

  const discardedAccountsResponse = await fetch(`${baseUrl}/static/discardedAccounts.json`)
  const discardedAccounts = await discardedAccountsResponse.json()

  const processTimeline = async () => {
    const reportedUsers = await Storage.get_item('reportedUsers')

    let timelineDiv = document.querySelector('[aria-label="Timeline: Your Home Timeline"]')
    if(!timelineDiv) {
      timelineDiv = document.querySelector('[aria-label="Timeline: Conversation"]')
      if(!timelineDiv) return
    }
    const tweetsDivs = timelineDiv.querySelectorAll('[data-testid="cellInnerDiv"]')

    const tweetsUsers = Array.from(tweetsDivs).map((tweetDiv) => {
      const username = tweetDiv.innerText.split('\n')[1]

      return {username, tweetDiv}
    })

    tweetsUsers.forEach(({username, tweetDiv}) => {
      if(!username) return
      if(blockedAccounts.includes(username) || reportedUsers.includes(username)){
        tweetDiv.remove()
        console.log(`Tweet do usuário ${username} removido`)
        return
      }

      if(username && discardedAccounts.includes(username)){
        console.log(`Tweet do usuário ${username} descartado`)
        return
      }
      if(reportedUsers.includes(username)){
        console.log(`Tweet do usuário ${username} já reportado`)
        return
      }

      // add report button
      const actionButtonsContainer = tweetDiv.querySelector('[role="group"]')

      if(!actionButtonsContainer) return

      // verify if report button already exists
      const reportButtonExists = actionButtonsContainer.innerHTML.includes('report-button')
      if(reportButtonExists) return
      const reportButton = document.createElement('div')
      reportButton.className = actionButtonsContainer.childNodes[4].className

    reportButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" report-button width="16" height="16" fill="rgb(113, 118, 123)" class="bi bi-robot" viewBox="0 0 16 16">
    <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5M3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.58 26.58 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.933.933 0 0 1-.765.935c-.845.147-2.34.346-4.235.346-1.895 0-3.39-.2-4.235-.346A.933.933 0 0 1 3 9.219zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a24.767 24.767 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25.286 25.286 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135Z"/>
    <path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2zM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5"/>
  </svg>`
      reportButton.style.cursor = 'pointer'
      reportButton.style.marginTop = '3px'


      reportButton.onclick = async (event) => {
        console.log(`Reportando tweet do usuário ${username}`)
        event.stopPropagation();
        event.preventDefault();
        reportedUsers.push(username)
          await Storage.set_item('reportedUsers', JSON.stringify(reportedUsers))
        const responseReport = await fetch(`${baseUrl}/report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({accountId: username})
        })
        const responseReportJson = await responseReport.json()
        if(responseReportJson.success){
          
          console.log(`Tweet do usuário ${username} reportado`)
          alert(`Tweet do usuário ${username} reportado`)
        }
      }

      // add as anti penultimo filho
      actionButtonsContainer.insertBefore(reportButton, actionButtonsContainer.childNodes[5])



    })
  }

  setInterval(processTimeline, 100);
}
main()