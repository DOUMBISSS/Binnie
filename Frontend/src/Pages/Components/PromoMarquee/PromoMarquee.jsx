import React, { useEffect, useState } from "react";
import axios from "axios";

export default function PromoMarquee() {
  const [promos, setPromos] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();

        // 🔹 Récupérer les promos actives
        const resPromos = await axios.get("https://backend-codeshop225.onrender.com/promos");
        const activePromos = resPromos.data.filter(p => new Date(p.expiresAt) >= now);
        setPromos(activePromos);

        // 🔹 Récupérer les messages actifs
        const resMessages = await axios.get("https://backend-codeshop225.onrender.com/get/messages");
        const activeMessages = resMessages.data.filter(m => {
          const expire = new Date(m.expiresAt);
          return expire.setHours(23, 59, 59, 999) >= now.getTime();
        });
        setMessages(activeMessages);

      } catch (err) {
        console.error("Erreur récupération promos/messages :", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!promos.length && !messages.length) return null;

  const itemsToShow = [
    ...promos.map(p => ({
      id: p._id,
      text: `🎁 ${p.code} - ${p.description || "Réduction spéciale"} (${p.type === "percentage" ? `${p.value}%` : `${p.value} FCFA`})`
    })),
    ...messages.map(m => ({
      id: m._id,
      text: `📢 ${m.text}`
    }))
  ];

  return (
    <div style={{
      background:"white",
      color: "#111",
      padding: "10px 0",
      overflow: "hidden",
      whiteSpace: "nowrap"
    }}>
      <div
        style={{
          display: "inline-block",
          paddingLeft: "100%",
          animation: "marquee 20s linear infinite"
        }}
      >
        {itemsToShow.map(item => (
          <span key={item.id} style={{ marginRight: "50px" }}>
            {item.text}
          </span>
        ))}
      </div>

      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-100%); }
          }
        `}
      </style>
    </div>
  );
}