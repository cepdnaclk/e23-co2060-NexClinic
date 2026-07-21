const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/app/(protected)/user-self/edit-profile/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const components = `function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
      {description ? (
        <p className="text-sm leading-6 text-slate-600 sm:text-[0.95rem]">{description}</p>
      ) : null}
    </div>
  );
}

function FieldCard({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">{label}</label>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-slate-900 shadow-sm shadow-emerald-100/10 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}

function SelectCard({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-slate-900 shadow-sm shadow-emerald-100/10 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      >
        <option value="">{placeholder || \`Select \${label}\`}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaCard({
  label,
  value,
  onChange,
  placeholder,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
}) {
  return (
    <div className="md:col-span-2">
      <label className="mb-2 block text-sm font-semibold text-slate-800">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-slate-900 shadow-sm shadow-emerald-100/10 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
      {helperText ? <p className="mt-2 text-xs text-slate-500">{helperText}</p> : null}
    </div>
  );
}

function StatusPill({ children, tone = "emerald" }: { children: React.ReactNode; tone?: "emerald" | "slate" | "teal" | "amber" | "rose" }) {
  const toneClasses =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "teal"
        ? "bg-teal-50 text-teal-700 ring-teal-200"
        : tone === "amber"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : tone === "rose"
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : "bg-white text-slate-600 ring-slate-200";

  return (
    <span className={\`rounded-full px-3 py-1 text-xs font-semibold ring-1 \${toneClasses}\`}>
      {children}
    </span>
  );
}`;

content = content.replace(/function SectionHeader[\s\S]*?function UserEditProfilePage\(\) \{/, components + '\n\nexport default function UserEditProfilePage() {');

// Input fields
content = content.replace(/<FieldCard label="([^"]+)">\s*<input\s+type="([^"]+)"\s+name="([^"]+)"\s+value=\{formData\.([^\}]+)\}\s+onChange=\{handleChange\}\s+className="[^"]+"\s+placeholder="([^"]+)"\s*\/>\s*<\/FieldCard>/g, 
  (match, label, type, name, val, placeholder) => {
    return `<FieldCard
                        label="${label}"
                        type="${type}"
                        value={formData.${val}}
                        onChange={(val) => handleChange({ target: { name: '${name}', value: val } } as any)}
                        placeholder="${placeholder}"
                      />`;
  }
);

// TextArea fields
content = content.replace(/<FieldCard label="([^"]+)">\s*<textarea\s+name="([^"]+)"\s+value=\{formData\.([^\}]+)\}\s+onChange=\{handleChange\}\s+rows=\{3\}\s+className="[^"]+"\s+placeholder="([^"]+)"\s*\/>\s*<\/FieldCard>/g,
  (match, label, name, val, placeholder) => {
    return `<TextAreaCard
                        label="${label}"
                        value={formData.${val}}
                        onChange={(val) => handleChange({ target: { name: '${name}', value: val } } as any)}
                        placeholder="${placeholder}"
                      />`;
  }
);

// Select fields
content = content.replace(/<FieldCard label="Gender">\s*<select\s+name="gender"\s+value=\{formData\.gender\}\s+onChange=\{handleChange\}\s+className="[^"]+"\s*>\s*<option value="" disabled>\s*Select Gender\s*<\/option>\s*<option value="Male">Male<\/option>\s*<option value="Female">Female<\/option>\s*<option value="Other">Other<\/option>\s*<\/select>\s*<\/FieldCard>/, 
  `<SelectCard
                        label="Gender"
                        value={formData.gender}
                        onChange={(val) => handleChange({ target: { name: 'gender', value: val } } as any)}
                        options={[
                          { label: 'Male', value: 'Male' },
                          { label: 'Female', value: 'Female' },
                          { label: 'Other', value: 'Other' },
                        ]}
                      />`
);

content = content.replace(/<FieldCard label="Blood Type">\s*<select\s+name="bloodType"\s+value=\{formData\.bloodType\}\s+onChange=\{handleChange\}\s+className="[^"]+"\s*>\s*<option value="" disabled>\s*Select Blood Type\s*<\/option>\s*<option value="A\+">A\+<\/option>\s*<option value="A-">A-<\/option>\s*<option value="B\+">B\+<\/option>\s*<option value="B-">B-<\/option>\s*<option value="AB\+">AB\+<\/option>\s*<option value="AB-">AB-<\/option>\s*<option value="O\+">O\+<\/option>\s*<option value="O-">O-<\/option>\s*<\/select>\s*<\/FieldCard>/,
  `<SelectCard
                        label="Blood Type"
                        value={formData.bloodType}
                        onChange={(val) => handleChange({ target: { name: 'bloodType', value: val } } as any)}
                        options={[
                          { label: 'A+', value: 'A+' },
                          { label: 'A-', value: 'A-' },
                          { label: 'B+', value: 'B+' },
                          { label: 'B-', value: 'B-' },
                          { label: 'AB+', value: 'AB+' },
                          { label: 'AB-', value: 'AB-' },
                          { label: 'O+', value: 'O+' },
                          { label: 'O-', value: 'O-' },
                        ]}
                      />`
);

// The file uploads
content = content.replace(/<FieldCard label="Upload reports">/g, `<div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm shadow-emerald-100/20 backdrop-blur-sm">\n<label className="mb-2 block text-sm font-semibold text-slate-800">Upload reports</label>`);
content = content.replace(/<FieldCard label="Upload documents">/g, `<div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm shadow-emerald-100/20 backdrop-blur-sm">\n<label className="mb-2 block text-sm font-semibold text-slate-800">Upload documents</label>`);

// Replace the closing tags for the upload cards.
// We can just rely on the fact that those are the only two remaining </FieldCard> tags in the document if we replaced all other FieldCards.
content = content.replace(/<\/FieldCard>/g, `</div>`);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated the file.');
