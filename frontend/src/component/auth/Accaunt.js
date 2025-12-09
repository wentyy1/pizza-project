import React, { useState, useRef, useEffect } from "react";

export default function Accaunt({ user = { name: "Користувач" }, onNavigate, onLogout }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        function handleOutside(e) {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const initials = (user.name || "К").split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase();

    function handleSelect(key) {
        setOpen(false);
        if (typeof onNavigate === "function") onNavigate(key);
        else {
            // default simple navigation (adjust routes if you use react-router)
            if (key === "profile") window.location.hash = "/profile";
            if (key === "orders") window.location.hash = "/orders";
            if (key === "settings") window.location.hash = "/settings";
        }
    }

    function handleLogout() {
        setOpen(false);
        if (typeof onLogout === "function") onLogout();
        else {
            // default logout placeholder
            console.log("logout");
            window.location.reload();
        }
    }

    const styles = {
        root: { position: "relative", display: "inline-block", fontFamily: "sans-serif" },
        button: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer"
        },
        avatar: {
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#2b8aef",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600
        },
        menu: {
            position: "absolute",
            right: 0,
            marginTop: 8,
            minWidth: 180,
            borderRadius: 8,
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            background: "#fff",
            border: "1px solid #eee",
            zIndex: 20,
            overflow: "hidden"
        },
        item: {
            padding: "10px 12px",
            cursor: "pointer",
            borderBottom: "1px solid #f4f4f4",
            background: "transparent"
        },
        footer: { padding: "8px 12px", fontSize: 12, color: "#666" }
    };

    return (
        <div ref={rootRef} style={styles.root}>
            <button
                type="button"
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => setOpen(s => !s)}
                style={styles.button}
            >
                <div style={styles.avatar}>{initials}</div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{user.name || "Користувач"}</span>
                    <span style={{ fontSize: 12, color: "#666" }}>Акаунт</span>
                </div>
            </button>

            {open && (
                <div role="menu" style={styles.menu}>
                    <div role="menuitem" tabIndex={0} style={styles.item} onClick={() => handleSelect("profile")}>
                        Профіль
                    </div>
                    <div role="menuitem" tabIndex={0} style={styles.item} onClick={() => handleSelect("orders")}>
                        Замовлення
                    </div>
                    <div role="menuitem" tabIndex={0} style={styles.item} onClick={() => handleSelect("settings")}>
                        Налаштування
                    </div>
                    <div role="menuitem" tabIndex={0} style={styles.item} onClick={handleLogout}>
                        Вихід
                    </div>
                    <div style={styles.footer}>Порада: додайте маршрути або обробники через props</div>
                </div>
            )}
        </div>
    );
}