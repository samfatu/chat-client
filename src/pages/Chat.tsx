import { useEffect, useRef, useState } from 'react';
import axios from '../api/axios';
import { ChatMessage, PushedChatMessage } from '../types/chat';
import { User } from '../types/user';
import { countNewMessages, findChatMessage, findChatMessages, getContactedFriends } from '../utils/chat';

var stompClient: any | null = null;

interface ChatState {
  chatActiveContact: any | null,
  chatMessages: (ChatMessage[] | PushedChatMessage[]) | null,
}

const initialState: ChatState = {
  chatActiveContact: null,
  chatMessages: null,
}

export default function Chat() {
  const [currentUser, setCurrentUser] = useState<User | null>();
  const [text, setText] = useState("");
  const [contacts, setContacts] = useState<User[]>([]);
  const [chatState, setChatState] = useState<ChatState>(initialState);
  const [notificationOpen, setNotificationOpen] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Set Current User for this page
  useEffect(() => {
    const getChoosenUser = async () => {
      let id = sessionStorage.getItem('currentUser');

      if (id === null) {
        const response = await axios.get('/users/' + 1);

        if (response.data) {
          setCurrentUser(response.data);
        } else {
          console.log('Current user cannot be fetched when id equals null');
        }
      } else {
        const response = await axios.get('/users/' + id);

        if (response.data) {
          setCurrentUser(response.data);
        } else {
          console.log('Current user cannot be fetched with id ' + id);
        }
      }
    }
    getChoosenUser();
  }, []);

  // Fetch contact list and set it to cantacts state
  useEffect(() => {
    let contactList = sessionStorage.getItem('contactList');

    if (contactList !== null) {
      setContacts(JSON.parse(contactList));
    }
  }, []);

  const setMessages = (messages: ChatMessage[] | PushedChatMessage[]) => {
    setChatState({...chatState, chatMessages: messages});
  }

  const pushMessage = (message: ChatMessage) => {
    if (chatState.chatMessages !== null) {
      setChatState({...chatState, chatMessages: [...chatState.chatMessages, message]});
    }
  }

  const setActiveContact = (id: number) => {
    sessionStorage.setItem('chatActive', id.toString());
    setChatState({...chatState, chatActiveContact: contacts.find((user) => user.id === id )})
  }


  const scrollToBottom = () => {
    if (messagesEndRef !== null) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatState.chatMessages]);

  useEffect(() => {
    if (currentUser) {
      console.log('Connect use effect')
      connect();
      loadContacts();
    }
  }, [currentUser])

  useEffect(() => {
    if (chatState.chatActiveContact === null) return;
    if (!currentUser) return;
    findChatMessages(chatState.chatActiveContact?.id, currentUser?.id).then((msgs) =>
      setMessages(msgs.data)
    );
    loadContacts();
  }, [chatState.chatActiveContact]);

  const connect = () => {
    const Stomp = require("stompjs");
    var SockJS = require("sockjs-client");
    SockJS = new SockJS("http://localhost:8080/ws");
    stompClient = Stomp.over(SockJS);
    stompClient.connect({}, onConnected, onError);
  }

  const onConnected = () => {
    stompClient!.subscribe(
      "/user/" + currentUser!.id + "/queue/messages",
      onMessageReceived
    );
  };

  const onError = (err: any) => {
    setNotificationMessage(err);
    setNotificationOpen(true);
    console.log('Error: ', err);
  };

  const onMessageReceived = async (msg: any) => {
    const notification = JSON.parse(msg.body);
    const contactID = Number(window.sessionStorage.getItem("chatActive"));

    if (contactID !== null && (contactID === notification.senderId)) {
      await findChatMessage(notification.id).then((message) => {
        pushMessage(message.data);
      });
    } else {
      console.log("Received a new message from " + notification.senderName);
    }
    setNotificationOpen(true);
    setNotificationMessage("You have a new message from " + notification.senderName)
    loadContacts();
  };

  const sendMessage = (msg : any) => {
    if (currentUser) {
      if (msg.trim() !== "") {
        const message = {
          senderId: currentUser.id,
          recipientId: chatState.chatActiveContact.id,
          senderName: currentUser.name,
          recipientName: chatState.chatActiveContact.name,
          content: msg,
          timestamp: new Date(),
        };
        stompClient.send("/app/chat", {}, JSON.stringify(message));

        const newMessages = chatState.chatMessages ? [...chatState.chatMessages] : [];
        newMessages.push(message);
        setMessages(newMessages);
      }
    }
  };

  const loadContacts = async () => {
    const promise = getContactedFriends().then((response) =>
      response.data.map((contact: any) =>
        countNewMessages(contact.id, currentUser!.id).then((count) => {
          contact.newMessages = count.data;
          return contact;
        })
      )
    );

    await promise.then((promises) =>
      Promise.all(promises).then((users) => {
        setContacts(users);
        if (window.sessionStorage.getItem("chatActive") === null && users.length > 0) {
          setActiveContact(users[0]);
        }
      })
    );
  };

  const deleteChatHistory = async () => {
    if (currentUser && chatState.chatActiveContact) {
      const response = await axios.delete('/messages/' + currentUser.id + '/' + chatState.chatActiveContact.id);

      if (response.status === 200) {
        setNotificationMessage("Chat history successfully deleted!");
        setNotificationOpen(true);
        setMessages([]);
        loadContacts();
      }
    }
  }


  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ height: '90vh', width: '90%', display: 'flex', backgroundColor: 'white' }}>
        {/* <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          open={notificationOpen}
          onClose={() => setNotificationOpen(false)}
          autoHideDuration={2500}
          message={notificationMessage}
          key="topcenter"
        /> */}
        {/* <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', padding: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Typography>All chat history will be deleted.</Typography>
            <Typography>This process is irreversable.</Typography>
            <ButtonGroup sx={{ marginTop: 1 }}>
              <Button size="small" color='error' onClick={deleteChatHistory}>Delete</Button>
              <Button size="small" color='success'onClick={handleClose}>Cancel</Button>
            </ButtonGroup>
          </div>
        </Popover> */}
        <div style={{ width: 250, borderRight: '1px solid gray', overflow: 'auto' }}>
          <div style={{ borderBottom: "1px solid black", padding: 4 }}>
            <p style={{ fontWeight : 'bold' }}>Contact List</p>
          </div>
          {contacts.map((contact) => (
            <div
              className="list-item"
              key={contact.id}
              style={{ display: 'flex', height: 'auto', alignItems: 'center', paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4, background: chatState.chatActiveContact?.id === contact.id ? "linear-gradient(90deg, rgba(112,76,163,0.5) 0%, rgba(191,45,253,0.5) 100%)" : "" }}
              onClick={() => setActiveContact(contact.id)}
            >
              {/* {contact.newMessages !== undefined &&
                contact.newMessages > 0 ? (
                  <StyledBadge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                  >
                    <Avatar src={contact.profilePhoto} sx={{ marginRight: 1 }} />
                  </StyledBadge>
                ): <Avatar src={contact.profilePhoto} sx={{ marginRight: 1 }} />} */}
                <p>{contact.name}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {chatState.chatActiveContact ? (
            <>
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', paddingLeft: 10, borderBottom: '1px gray solid' }}>
              <p>{chatState.chatActiveContact?.name}</p>
              <div style={{ marginLeft: 'auto', marginRight: 12 }}>
                <button onClick={deleteChatHistory}>Delete Chat History</button>
              </div>
            </div>
            <div style={{ flexGrow: 20, overflowY: 'scroll' }}>
              <ul style={{ listStyleType: 'none' }}>
                {chatState.chatMessages?.map((msg) => (
                  <li key={msg.timestamp.toISOString()} style={msg.senderId === currentUser?.id ? {
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      marginRight: 20,
                      marginBottom: 10,
                      marginTop: 10
                      } : {
                        display: 'flex',
                        alignItems: 'center',
                        marginRight: 20,
                        marginBottom: 10,
                        marginTop: 10
                        }}>
                    {msg.senderId === currentUser?.id && (<p style={{ marginRight: 5, fontSize: 10 }}>{new Date(msg.timestamp).toLocaleDateString()}</p>)}
                    <div style={{ background: 'linear-gradient(0deg, rgba(112,76,163,0.5) 0%, rgba(191,45,253,0.5) 100%)', padding: 10, borderRadius: 15 }}>
                      <p>{msg.content}</p>
                    </div>
                    {msg.senderId !== currentUser?.id && (<p style={{ marginLeft: 5, fontSize: 10  }}>{new Date(msg.timestamp).toLocaleDateString()}</p>)}
                  </li>
                ))}
              </ul>
              <div ref={messagesEndRef} />
            </div>
            <div style={{ flexGrow: 0.1, padding: 10, borderTop: '1px gray solid' }}>
              <input
                name="user_input"
                value={text}
                autoFocus
                onChange={(event) => setText(event.target.value)}
                onKeyPress={(event) => {
                  if (event.key === "Enter") {
                    sendMessage(text);
                    setText("");
                  }
                }}
                style={{ width: '89%', height: 38, marginRight: 10 }}
              />
              <button onClick={() => {
                sendMessage(text);
                setText("");
              }}>Send</button>
            </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flex:1, alignItems: 'center', justifyContent: 'center' }}>
                Select a contact from the left menu.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
