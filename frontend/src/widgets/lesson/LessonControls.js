import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
export const LessonControls = ({ localStream }) => {
    const { t } = useTranslation('lesson');
    const navigate = useNavigate();
    const [mic, setMic] = useState(true);
    const [cam, setCam] = useState(true);
    const toggleMic = () => {
        localStream?.getAudioTracks().forEach(t => { t.enabled = !mic; });
        setMic(v => !v);
    };
    const toggleCam = () => {
        localStream?.getVideoTracks().forEach(t => { t.enabled = !cam; });
        setCam(v => !v);
    };
    const handleLeave = () => {
        localStream?.getTracks().forEach(t => t.stop());
        navigate('/dashboard');
    };
    return (_jsxs("div", { className: "bg-slate-900 border-t border-slate-800 px-4 py-3\r\n      flex items-center justify-center gap-3 flex-wrap", children: [_jsx(ControlBtn, { onClick: toggleMic, active: mic, title: mic ? t('controls.micOff') : t('controls.micOn'), icon: mic ? '🎤' : '🔇' }), _jsx(ControlBtn, { onClick: toggleCam, active: cam, title: cam ? t('controls.camOff') : t('controls.camOn'), icon: cam ? '📷' : '🚫' }), _jsx("button", { onClick: handleLeave, className: "bg-red-600 hover:bg-red-700 text-white text-sm font-medium\r\n          px-4 py-2.5 rounded-xl transition", children: t('controls.leave') })] }));
};
// ─── Control button ───────────────────────────────────────────
const ControlBtn = ({ onClick, active, title, icon, }) => (_jsx("button", { onClick: onClick, title: title, "aria-label": title, className: `p-2.5 rounded-xl transition text-lg leading-none
      ${active
        ? 'bg-slate-700 hover:bg-slate-600'
        : 'bg-red-600 hover:bg-red-700'}`, children: icon }));
