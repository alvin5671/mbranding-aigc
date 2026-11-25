(function () {
  const cfg = window.COURSE_CONFIG;
  if (!window.supabase || !cfg) {
    console.error("Supabase SDK or COURSE_CONFIG missing");
    return;
  }
  window.sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  window.registerWithCode = async function ({ email, code, password }) {
    const res = await fetch(cfg.REGISTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.SUPABASE_PUBLISHABLE_KEY
      },
      body: JSON.stringify({
        email: (email || "").trim(),
        code: (code || "").trim(),
        password: password || ""
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "注册失败，请检查邮箱和注册码。");
    }
    const { error: signInErr } = await window.sb.auth.signInWithPassword({
      email: (email || "").trim().toLowerCase(),
      password
    });
    if (signInErr) {
      throw new Error("账号已开通，请使用刚才设置的密码登录。");
    }
    return data;
  };

  window.checkActiveEnrollment = async function () {
    const { data: { session } } = await window.sb.auth.getSession();
    if (!session) return { session: null, enrollment: null };
    const { data: enrollment, error } = await window.sb
      .from("enrollments")
      .select("user_id, email, status, enrolled_at")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (error || !enrollment || enrollment.status !== "active") {
      return { session, enrollment: null };
    }
    return { session, enrollment };
  };
})();
