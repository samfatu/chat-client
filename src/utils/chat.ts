import axios from "../api/axios";

export function getContactedFriends() {
  return axios.get('/users');
}

export function countNewMessages(senderId: number, recipientId: number) {
  return axios.get("/messages/" + senderId + "/" + recipientId + "/count");
}

export function findChatMessages(senderId: number, recipientId: number) {
  return axios.get('/messages/' + senderId + '/' + recipientId);
}

export function findChatMessage(id : number) {
  return axios.get("/messages/" + id);
}