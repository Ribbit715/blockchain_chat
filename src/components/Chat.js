import Web3 from 'web3';
import React, { Component } from 'react';
import ChatApp from '../abis/ChatApp.json'
import mainLogo from './arrow.png'

class Chat extends Component {

    async componentWillMount() {
        console.log(window.ethereum)
        await this.loadWeb3()
        await this.loadBlockchainData()
        await this.listenToMessages()
      }

    constructor(props) {
        super(props)
        let chats = [
            {
                msg: "What are you doing tonight ? Want to go take a drink ?",
                response: true
            },
            {
                msg: "Hey Megan ! It's been a while 😃",
                response: false
            }
        ]
        this.state = {
            chats: chats,
            inputValue: '',
            accounts: [],
            account: '',
            otherAccount: ''
        }
    }

    async loadWeb3() {
        if (window.ethereum) {
    
          // Need to put ws:// instead of http:// because of web sockets.
          // Web sockets are mandatory to listen to events.
          window.web3 = new Web3(Web3.providers.WebsocketProvider("ws://localhost:7545"))
          await window.ethereum.enable()
        }
        else if (window.web3) {
          window.web3 = new Web3(window.web3.currentProvider)
        }
        else {
          window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
        }
      }

    async loadBlockchainData()  {
        const web3 = window.web3
    
        const accounts = await web3.eth.getAccounts()
        this.setState({ 
            accounts: accounts,
            account: accounts[0],
            otherAccount: accounts[1]
         })
        console.log(accounts)
    
        const ethBalance = await web3.eth.getBalance(this.state.account)
        this.setState({ ethBalance })
    
        // Load smart contract
        const networkId =  await web3.eth.net.getId()
        const chatAppData = ChatApp.networks[networkId]
        const abi = ChatApp.abi
        if(chatAppData) {
          const chatContract = new web3.eth.Contract(abi, chatAppData.address)
          this.setState({ chatContract: chatContract })
        }
        else {
            window.alert('Chat contract not deployed to detected network.')
        }
    }

    async listenToMessages() {
        var binded = this.didReceiveMessageBinded.bind(this)
        this.state.chatContract.events.messageSentEvent({})
        .on('data', binded)
        .on('error', console.error);
    }

    didReceiveMessage(message, isResponse) {
        let chats = this.state.chats
        chats.push(
            {
                msg: message,
                response: isResponse
            }
        )
        this.setState({
            chats: chats,
            inputValue: ''
        })
    }

    async didReceiveMessageBinded(event){
        const message = event.returnValues.message
        if (event.returnValues.from === this.state.account){
            this.didReceiveMessage(message, true)
        }
        if (event.returnValues.to === this.state.account){
            this.didReceiveMessage(message, false)
        }
    }

    getMessagesAsDivs() {
        let chatDivs = this.state.chats.map(x => x.response ? 
            <div class="message text-only">
                <div class="response">
                    <p class="text"> {x.msg} </p>
                    </div>
                </div> :
            <div class="message text-only">
                <p class="text"> {x.msg} </p>
            </div>
        )
        return chatDivs.reverse()
    }

    getToggleAdresses(isOtherAccount) {
        var addresses = []
        for (var i = 0; i < this.state.accounts.length; i++) {
            let account = this.state.accounts[i]
            if (isOtherAccount && account == this.state.otherAccount
                || !isOtherAccount && account == this.state.account)
                addresses.push(<option value={account} selected>{account}</option>)
            else {
                addresses.push(<option value={account}>{account}</option>)
            }
        }
        return addresses
    }

    async didSendMessage(message) {
        await this.state.chatContract.methods.sendMsg(this.state.otherAccount, message).send({ from: this.state.account })
    }

    updateInputValue(evt) {
        this.setState({
          inputValue: evt.target.value
        });
      }

    updateAddressSelect(newValue, isOtherAccount) {
        if (isOtherAccount) {
            this.setState({
                otherAccount: newValue
            })
        }
        else {
            this.setState({
                account: newValue
            })
        }
    }

    render() {
        return (
        <body>
            <div class="container">
                <section class="chat">
                    <div class="header-chat">
                        <div class="left">
                            <img src={mainLogo} class="arrow"/>
                            <select class="custom-select" onChange={e => this.updateAddressSelect(e.target.value, false)} >
                                { this.getToggleAdresses(false) }
                            </select>     
                        </div>
                        <div class="right">
                            <select class="custom-select" onChange={e => this.updateAddressSelect(e.target.value, true)} >
                                { this.getToggleAdresses(true) }
                            </select>  
                        </div>
                    </div>
                    <div class="messages-chat">
                    { this.getMessagesAsDivs() }
                    </div>
                </section>
                <div class="footer-chat">
                    <i class="icon fa fa-smile-o clickable" style={{fontSize: "25pt"}} aria-hidden="true"></i>
                    <input value={this.state.inputValue} onChange={evt => this.updateInputValue(evt)} type="text" class="write-message" placeholder="Type your message here"></input>
                    <i class="icon send fa fa-paper-plane-o clickable" aria-hidden="true"></i>
                    <button class="btn btn-success send-btn" onClick={() => this.didSendMessage(this.state.inputValue)}>Send</button>
                </div>
                </div>
        </body>)
    }

}

export default Chat;