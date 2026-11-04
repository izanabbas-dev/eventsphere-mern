import { Check, X } from "lucide-react";
import { getPasswordRules } from "../utils/helpers";

// Live checklist under the password fields
export default function PasswordRules({ password, confirmPassword }) {
  const rules = [
    ...getPasswordRules(password),
    { text: "Passwords match", ok: password.length > 0 && password === confirmPassword },
  ];

  return (
    <ul className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm" aria-label="Password rules">
      {rules.map((rule) => (
        <li key={rule.text} className={`flex items-center gap-2 ${rule.ok ? "text-green-700" : "text-slate-500"}`}>
          {rule.ok ? <Check className="h-4 w-4" aria-hidden="true" /> : <X className="h-4 w-4" aria-hidden="true" />}
          {rule.text}
          <span className="sr-only">{rule.ok ? "(done)" : "(not done)"}</span>
        </li>
      ))}
    </ul>
  );
}
