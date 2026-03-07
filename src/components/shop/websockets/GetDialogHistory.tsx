import {useEffect, useState} from "react";
import axios from "axios";

interface Message {
  id: string;
  message: string;
  username: string;
  timestamp: Date;
  isOwn: boolean;
  isButton?: boolean;
  type?: string; // 'system', 'bot', 'operator', 'client', 'media'
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  mimeType?: string
}

export default function DialogHistory() {
  const [message, setMessage] = useState<Message[]>([])

  useEffect(() => {
    axios.get("http://localhost:8000/get-user-dialog").then((msg) => {setMessage(msg.data)})
  }, []);


}