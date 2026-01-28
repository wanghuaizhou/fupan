(() => {
  const { useState, useEffect, useMemo, useRef } = React;

  // 全局 Supabase 客户端
  let supabaseClient = null;

  /** 将 Supabase / 英文错误信息转为中文提示；未匹配则返回原文，便于排查原因 */
  function errToChinese(msg) {
    if (!msg || typeof msg !== "string") return "操作失败，请稍后重试。";
    const s = msg.toLowerCase();
    if (s.includes("row-level security") || s.includes("violates row-level security"))
      return "保存失败：当前账号没有写入权限（可能是登录状态异常，请退出后重新登录再试）。";
    if (s.includes("jwt expired") || s.includes("refresh token"))
      return "登录已过期，请重新登录。";
    if (s.includes("invalid api key") || s.includes("api key"))
      return "Supabase 配置有误，请检查 supabase-config.js 中的 anonKey。";
    if (s.includes("fetch") && (s.includes("failed") || s.includes("network")))
      return "网络请求失败，请检查网络后重试。";
    if (s.includes("storage") && (s.includes("bucket") || s.includes("not found")))
      return "存储桶未配置或不存在，请先在 Supabase Storage 创建 review-photos 并设为公开。";
    if (s.includes("unique") || s.includes("duplicate"))
      return "数据已存在或重复，请检查后重试。";
    if (s.includes("foreign key") || s.includes("constraint"))
      return "数据校验失败，请检查填写内容或联系管理员。";
    /* 登录/注册相关 */
    if (s.includes("invalid login credentials") || s.includes("invalid_credentials"))
      return "邮箱或密码错误，请检查后重试。";
    if (s.includes("email not confirmed") || s.includes("email_not_confirmed"))
      return "请先到邮箱查收验证邮件，点击链接完成验证后再登录。";
    if (s.includes("user already registered") || s.includes("already registered"))
      return "该邮箱已注册，请直接登录。";
    if (s.includes("signup requires a valid password") || s.includes("password"))
      return "密码不符合要求，请至少 6 位。";
    if (s.includes("token has expired") || s.includes("session expired"))
      return "登录已过期，请重新登录。";
    if (s.includes("too many requests") || s.includes("rate limit"))
      return "请求过于频繁，请稍后再试。";
    return msg;
  }

  function ensureSupabase() {
    if (!window.SUPABASE_CONFIG) {
      throw new Error("找不到 SUPABASE_CONFIG，请先复制并编辑 supabase-config.js。");
    }
    const supabase = window.supabase;
    if (!supabase || typeof supabase.createClient !== "function") {
      throw new Error(
        "Supabase 库未加载。请用本地服务器打开页面（例如：python -m http.server 8080），不要直接双击 index.html。"
      );
    }
    if (!supabaseClient) {
      supabaseClient = supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
      );
    }
    return supabaseClient;
  }

  // ---------- 工具方法 ----------

  function todayStr() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const DEFAULT_TAGS = [
    "追高",
    "止损犹豫",
    "计划外交易",
    "情绪化操作",
    "趋势跟随",
    "低吸",
    "打板",
    "缩量回撤",
    "复盘缺失",
  ];

  // ---------- 认证组件 ----------

  function AuthView({ onAuth }) {
    const [mode, setMode] = useState("signin"); // signin | signup
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    async function handleSubmit(e) {
      e.preventDefault();
      setError("");
      setMessage("");
      if (!email || !password) {
        setError("请填写邮箱和密码。");
        return;
      }
      setLoading(true);
      try {
        const client = ensureSupabase();
        if (mode === "signup") {
          const { data, error } = await client.auth.signUp({
            email,
            password,
          });
          if (error) throw error;
          if (data.user) {
            onAuth(data.user);
            setMessage("注册成功，已自动登录。");
          } else {
            setMessage("注册邮件已发送，请前往邮箱确认。");
          }
        } else {
          const { data, error } = await client.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          if (data.user) {
            onAuth(data.user);
          } else {
            setError("登录失败，请检查邮箱和密码。");
          }
        }
      } catch (err) {
        console.error(err);
        setError(errToChinese(err.message) || "操作失败，请稍后重试。");
      } finally {
        setLoading(false);
      }
    }

    return React.createElement(
      "div",
      { className: "auth-card" },
      React.createElement("div", { className: "app-title-main" }, [
        React.createElement("span", { key: "logo" }, "复盘笔记"),
        React.createElement("span", { className: "pill", key: "pill" }, "Supabase Web"),
      ]),
      React.createElement(
        "div",
        { className: "auth-subtitle" },
        "用一个简单的账号，在任意设备同步你的股市复盘。"
      ),
      React.createElement(
        "form",
        { onSubmit: handleSubmit },
        React.createElement(
          "div",
          { className: "field-group" },
          React.createElement(
            "label",
            null,
            "邮箱",
            React.createElement("span", { className: "hint" }, "建议使用常用邮箱")
          ),
          React.createElement("input", {
            type: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            placeholder: "you@example.com",
            autoComplete: "email",
          })
        ),
        React.createElement(
          "div",
          { className: "field-group" },
          React.createElement(
            "label",
            null,
            "密码",
            React.createElement("span", { className: "hint" }, "不少于 6 位")
          ),
          React.createElement("input", {
            type: "password",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            placeholder: "密码",
            autoComplete: "current-password",
          })
        ),
        React.createElement(
          "button",
          {
            type: "submit",
            className: "btn btn-primary",
            disabled: loading,
          },
          mode === "signup" ? "注册并登录" : "登录",
          loading ? "..." : ""
        )
      ),
      error &&
        React.createElement("div", { className: "status-error" }, error),
      message &&
        React.createElement("div", { className: "status-success" }, message),
      React.createElement(
        "div",
        { className: "auth-toggle" },
        mode === "signup" ? "已经有账号？" : "还没有账号？",
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError("");
              setMessage("");
            },
          },
          mode === "signup" ? "去登录" : "去注册"
        )
      )
    );
  }

  // ---------- 复盘编辑表单 ----------

  function ReviewForm({ user, onCreated, editing, onCancelEdit }) {
    const [date, setDate] = useState(editing ? editing.date : todayStr());
    const [title, setTitle] = useState(editing ? editing.title || "" : "");
    const [marketSummary, setMarketSummary] = useState(
      editing ? editing.market_summary || "" : ""
    );
    const [myTrades, setMyTrades] = useState(editing ? editing.my_trades || "" : "");
    const [reflection, setReflection] = useState(editing ? editing.reflection || "" : "");
    const [plan, setPlan] = useState(editing ? editing.plan || "" : "");
    const [returnPct, setReturnPct] = useState(editing != null && editing.return_pct != null ? String(editing.return_pct) : "");
    const [returnValue, setReturnValue] = useState(editing != null && editing.return_value != null ? String(editing.return_value) : "");
    const [tags, setTags] = useState(editing ? editing.tags || [] : []);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

    useEffect(() => {
      if (editing) {
        setDate(editing.date);
        setTitle(editing.title || "");
        setMarketSummary(editing.market_summary || "");
        setMyTrades(editing.my_trades || "");
        setReflection(editing.reflection || "");
        setPlan(editing.plan || "");
        setReturnPct(editing.return_pct != null ? String(editing.return_pct) : "");
        setReturnValue(editing.return_value != null ? String(editing.return_value) : "");
        setTags(editing.tags || []);
      } else {
        setDate(todayStr());
        setTitle("");
        setMarketSummary("");
        setMyTrades("");
        setReflection("");
        setPlan("");
        setReturnPct("");
        setReturnValue("");
        setTags([]);
      }
      setFile(null);
      setStatus("");
      setError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, [editing]);

    function toggleTag(tag) {
      setTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      );
    }

    async function uploadPhotoIfNeeded(reviewId) {
      if (!file) return null;
      const config = window.SUPABASE_CONFIG || {};
      if (!config.storageBucket) {
        throw new Error("storageBucket 未配置，无法上传图片。");
      }
      const client = ensureSupabase();
      setUploading(true);
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${reviewId || "new"}/${Date.now()}.${ext}`;
        const { data, error } = await client.storage
          .from(config.storageBucket)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });
        if (error) throw error;
        const { data: publicUrlData } = client.storage
          .from(config.storageBucket)
          .getPublicUrl(data.path);
        return {
          path: data.path,
          url: publicUrlData.publicUrl,
        };
      } finally {
        setUploading(false);
      }
    }

    async function handleSubmit(e) {
      e.preventDefault();
      setError("");
      setStatus("");
      if (!date) {
        setError("请填写日期。");
        return;
      }
      if (!title && !marketSummary && !myTrades && !reflection && !plan && !returnPct.trim() && !returnValue.trim()) {
        setError("至少填写一项内容。");
        return;
      }
      setSaving(true);
      try {
        const client = ensureSupabase();

        // 先写入/更新复盘主记录
        let reviewId = editing ? editing.id : undefined;
        const pct = returnPct.trim() ? parseFloat(returnPct) : null;
        const val = returnValue.trim() ? parseFloat(returnValue) : null;
        let reviewPayload = {
          user_id: user.id,
          date,
          title: title || null,
          market_summary: marketSummary || null,
          my_trades: myTrades || null,
          reflection: reflection || null,
          plan: plan || null,
          tags,
          return_pct: pct != null && !Number.isNaN(pct) ? pct : null,
          return_value: val != null && !Number.isNaN(val) ? val : null,
        };

        if (editing) {
          const { data, error } = await client
            .from("reviews")
            .update(reviewPayload)
            .eq("id", editing.id)
            .select()
            .single();
          if (error) throw error;
          reviewId = data.id;
          reviewPayload = data;
        } else {
          const { data, error } = await client
            .from("reviews")
            .insert(reviewPayload)
            .select()
            .single();
          if (error) throw error;
          reviewId = data.id;
          reviewPayload = data;
        }

        // 如果有图片，则上传并写入 photo 表
        let photoRecord = null;
        if (file) {
          const uploaded = await uploadPhotoIfNeeded(reviewId);
          if (uploaded) {
            const { data, error } = await client
              .from("review_photos")
              .insert({
                user_id: user.id,
                review_id: reviewId,
                path: uploaded.path,
                url: uploaded.url,
              })
              .select()
              .single();
            if (error) throw error;
            photoRecord = data;
          }
        }

        setStatus(editing ? "已更新今日复盘。" : "复盘已保存。");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (!editing) {
          setTitle("");
          setMarketSummary("");
          setMyTrades("");
          setReflection("");
          setPlan("");
          setReturnPct("");
          setReturnValue("");
          setTags([]);
        }
        onCreated({
          review: reviewPayload,
          photo: photoRecord,
        });
      } catch (err) {
        console.error(err);
        setError(errToChinese(err.message) || "保存失败，请稍后重试。");
      } finally {
        setSaving(false);
      }
    }

    return React.createElement(
      "div",
      { className: "column column-left" },
      React.createElement(
        "div",
        { className: "column-header" },
        React.createElement(
          "div",
          null,
          React.createElement("div", { className: "column-title" }, "日内复盘"),
          React.createElement(
            "div",
            { className: "column-subtitle" },
            editing ? "编辑已保存的复盘记录" : "记录今天大盘、操作、情绪与复盘结论。"
          )
        ),
        React.createElement(
          "div",
          { className: "segment-control" },
          React.createElement(
            "div",
            {
              className:
                "segment-option " + (!editing ? "segment-option-active" : ""),
            },
            "新建"
          ),
          React.createElement(
            "div",
            {
              className:
                "segment-option " + (editing ? "segment-option-active" : ""),
            },
            "编辑"
          )
        )
      ),
      React.createElement(
        "form",
        { onSubmit: handleSubmit },
        React.createElement(
          "div",
          { className: "field-row" },
          React.createElement(
            "div",
            { className: "field-group" },
            React.createElement("label", null, "日期"),
            React.createElement("input", {
              type: "date",
              value: date,
              onChange: (e) => setDate(e.target.value),
            })
          ),
          React.createElement(
            "div",
            { className: "field-group" },
            React.createElement(
              "label",
              null,
              "标题",
              React.createElement(
                "span",
                { className: "hint" },
                "如：高位退潮，控制仓位"
              )
            ),
            React.createElement("input", {
              type: "text",
              value: title,
              onChange: (e) => setTitle(e.target.value),
              placeholder: "给今天起个标题",
            })
          )
        ),
        React.createElement(
          "div",
          { className: "field-group" },
          React.createElement(
            "label",
            null,
            "大盘 & 热点",
            React.createElement(
              "span",
              { className: "hint" },
              "指数、情绪、主线、龙头"
            )
          ),
          React.createElement("textarea", {
            value: marketSummary,
            onChange: (e) => setMarketSummary(e.target.value),
            placeholder:
              "例：三大指数冲高回落，情绪分歧加大，机器人、高股息表现强势……",
          })
        ),
        React.createElement(
          "div",
          { className: "field-group" },
          React.createElement(
            "label",
            null,
            "今日操作",
            React.createElement(
              "span",
              { className: "hint" },
              "买卖点、逻辑、是否遵守计划"
            )
          ),
          React.createElement("textarea", {
            value: myTrades,
            onChange: (e) => setMyTrades(e.target.value),
            placeholder:
              "例：早盘按计划低吸 XX，午后情绪化追高 YY，未设置止损……",
          })
        ),
        React.createElement(
          "div",
          { className: "field-group" },
          React.createElement(
            "label",
            null,
            "得失复盘",
            React.createElement(
              "span",
              { className: "hint" },
              "今天最大的 1-2 个问题 / 收获"
            )
          ),
          React.createElement("textarea", {
            value: reflection,
            onChange: (e) => setReflection(e.target.value),
            placeholder:
              "例：情绪化交易再一次出现；没有完全按照仓位计划执行；对主线理解更清晰……",
          })
        ),
        React.createElement(
          "div",
          { className: "field-group" },
          React.createElement(
            "label",
            null,
            "明日计划",
            React.createElement(
              "span",
              { className: "hint" },
              "仓位安排、关注标的、禁止项"
            )
          ),
          React.createElement("textarea", {
            value: plan,
            onChange: (e) => setPlan(e.target.value),
            placeholder:
              "例：控制仓位不超过 5 成；只做主线回调低吸；禁止追当天涨停板……",
          })
        ),
        React.createElement(
          "div",
          { className: "field-row" },
          React.createElement(
            "div",
            { className: "field-group" },
            React.createElement(
              "label",
              null,
              "收益百分比",
              React.createElement("span", { className: "hint" }, "例：5.2 即 +5.2%，可负")
            ),
            React.createElement("input", {
              type: "number",
              step: 0.01,
              value: returnPct,
              onChange: (e) => setReturnPct(e.target.value),
              placeholder: "5.2",
            })
          ),
          React.createElement(
            "div",
            { className: "field-group" },
            React.createElement(
              "label",
              null,
              "收益值",
              React.createElement("span", { className: "hint" }, "元，可负")
            ),
            React.createElement("input", {
              type: "number",
              step: 0.01,
              value: returnValue,
              onChange: (e) => setReturnValue(e.target.value),
              placeholder: "500",
            })
          )
        ),
        React.createElement(
          "div",
          { className: "field-group" },
          React.createElement("label", null, "标签"),
          React.createElement(
            "div",
            { className: "chips-row" },
            DEFAULT_TAGS.map((tag) =>
              React.createElement(
                "div",
                {
                  key: tag,
                  className:
                    "chip " + (tags.includes(tag) ? "chip-active" : ""),
                  onClick: () => toggleTag(tag),
                },
                tag
              )
            )
          )
        ),
        React.createElement(
          "div",
          { className: "field-group" },
          React.createElement(
            "label",
            null,
            "截图 / 照片",
            React.createElement(
              "span",
              { className: "hint" },
              "可选，JPG/PNG，单张"
            )
          ),
          React.createElement(
            "div",
            { className: "photos-input-row" },
            React.createElement("input", {
              ref: fileInputRef,
              type: "file",
              accept: "image/*",
              className: "file-input-hidden",
              "aria-hidden": "true",
              tabIndex: -1,
              onChange: (e) => {
                setFile(e.target.files?.[0] || null);
                e.target.value = "";
              },
            }),
            React.createElement(
              "button",
              {
                type: "button",
                className: "btn btn-ghost btn-sm",
                onClick: () => fileInputRef.current?.click(),
              },
              "选择文件"
            ),
            React.createElement(
              "div",
              { className: "photos-meta" },
              file ? "已选择：" + file.name : "未选择文件（可选，文字复盘更重要）"
            )
          )
        ),
        React.createElement(
          "div",
          { className: "field-row" },
          React.createElement(
            "button",
            {
              type: "submit",
              className: "btn btn-primary",
              disabled: saving || uploading,
            },
            editing ? "保存修改" : "保存今日复盘",
            saving || uploading ? "..." : ""
          ),
          editing &&
            React.createElement(
              "button",
              {
                type: "button",
                className: "btn btn-ghost",
                onClick: onCancelEdit,
                disabled: saving || uploading,
              },
              "取消编辑"
            )
        )
      ),
      status &&
        React.createElement("div", { className: "status-success" }, status),
      error && React.createElement("div", { className: "status-error" }, error),
      React.createElement(
        "div",
        { className: "footer" },
        "提示：",
        React.createElement(
          "span",
          null,
          "先保证每天有一条记录，再考虑逐步优化策略。"
        )
      )
    );
  }

  // ---------- 列表 & 详情 ----------

  function ReviewList({ user, reviews, photosByReviewId, onSelect, selectedId, onEdit }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
      async function load() {
        try {
          setLoading(true);
          setError("");
          const client = ensureSupabase();
          const { data, error } = await client
            .from("reviews")
            .select("*")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .order("created_at", { ascending: false });
          if (error) throw error;
          onSelect(null, data || [], true);
        } catch (err) {
          console.error(err);
          setError(errToChinese(err.message) || "加载复盘列表失败。");
        } finally {
          setLoading(false);
        }
      }
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.id]);

    const selected = useMemo(
      () => reviews.find((r) => r.id === selectedId) || null,
      [reviews, selectedId]
    );

    const selectedPhotos = useMemo(() => {
      if (!selected) return [];
      return photosByReviewId[selected.id] || [];
    }, [selected, photosByReviewId]);

    function summaryLine(r) {
      const parts = [];
      if (r.market_summary) parts.push("盘面");
      if (r.my_trades) parts.push("操作");
      if (r.reflection) parts.push("复盘");
      if (r.plan) parts.push("计划");
      if (r.return_pct != null || r.return_value != null) parts.push("收益");
      if (!parts.length) return "未填写具体内容";
      return parts.join(" / ");
    }

    function formatReturn(r) {
      const pct = r.return_pct != null ? (r.return_pct >= 0 ? "+" : "") + r.return_pct + "%" : null;
      const val = r.return_value != null ? (r.return_value >= 0 ? "+" : "") + r.return_value + " 元" : null;
      if (!pct && !val) return null;
      return [pct, val].filter(Boolean).join("　");
    }

    return React.createElement(
      "div",
      { className: "column column-right" },
      React.createElement(
        "div",
        { className: "column-header" },
        React.createElement(
          "div",
          null,
          React.createElement("div", { className: "column-title" }, "历史记录"),
          React.createElement(
            "div",
            { className: "column-subtitle" },
            "按日期回顾你的决策与情绪变化。"
          )
        ),
        React.createElement(
          "span",
          { className: "pill" },
          reviews.length ? `共 ${reviews.length} 天` : "暂无记录"
        )
      ),
      loading &&
        React.createElement(
          "div",
          { className: "status-bar" },
          "正在加载复盘记录……"
        ),
      error && React.createElement("div", { className: "status-error" }, error),
      !reviews.length && !loading
        ? React.createElement(
            "div",
            { className: "empty-state" },
            "还没有任何复盘记录。先在左侧写一条今天的复盘吧。"
          )
        : React.createElement(
            React.Fragment,
            null,
            React.createElement(
              "div",
              { className: "section-label" },
              "列表"
            ),
            React.createElement(
              "div",
              { className: "list" },
              reviews.map((r) =>
                React.createElement(
                  "div",
                  {
                    key: r.id,
                    className:
                      "list-item " + (selectedId === r.id ? "active" : ""),
                    onClick: () => onSelect(r.id),
                  },
                  React.createElement(
                    "div",
                    { className: "list-item-header" },
                    React.createElement(
                      "div",
                      { className: "list-item-title" },
                      r.title || "未命名复盘"
                    ),
                    React.createElement(
                      "div",
                      { className: "list-item-date" },
                      r.date || "-"
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "muted" },
                    summaryLine(r)
                  ),
                  React.createElement(
                    "div",
                    { className: "list-item-tags" },
                    (r.tags || []).slice(0, 4).map((tag) =>
                      React.createElement(
                        "span",
                        {
                          key: tag,
                          className:
                            "tag " +
                            (tag.includes("追高") || tag.includes("止损")
                              ? "tag-negative"
                              : tag.includes("趋势") || tag.includes("低吸")
                              ? "tag-positive"
                              : ""),
                        },
                        tag
                      )
                    ),
                    formatReturn(r)
                      ? React.createElement(
                          "span",
                          {
                            className:
                              "tag " +
                              ((r.return_pct != null && r.return_pct >= 0) ||
                              (r.return_value != null && r.return_value >= 0)
                                ? "tag-positive"
                                : "tag-negative"),
                          },
                          formatReturn(r)
                        )
                      : null,
                    (photosByReviewId[r.id] || []).length
                      ? React.createElement(
                          "span",
                          { className: "tag" },
                          `图${(photosByReviewId[r.id] || []).length}`
                        )
                      : null
                  )
                )
              )
            ),
            selected &&
              React.createElement(
                React.Fragment,
                null,
                React.createElement("div", { className: "divider" }),
                React.createElement(
                  "div",
                  { className: "section-label" },
                  "当日详情"
                ),
                React.createElement(
                  "div",
                  { className: "detail" },
                  React.createElement(
                    "div",
                    { className: "detail-row" },
                    React.createElement(
                      "div",
                      { className: "detail-row-label" },
                      "大盘 & 热点"
                    ),
                    React.createElement(
                      "div",
                      { className: "detail-row-content" },
                      selected.market_summary || "未填写"
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "detail-row" },
                    React.createElement(
                      "div",
                      { className: "detail-row-label" },
                      "今日操作"
                    ),
                    React.createElement(
                      "div",
                      { className: "detail-row-content" },
                      selected.my_trades || "未填写"
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "detail-row" },
                    React.createElement(
                      "div",
                      { className: "detail-row-label" },
                      "得失复盘"
                    ),
                    React.createElement(
                      "div",
                      { className: "detail-row-content" },
                      selected.reflection || "未填写"
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "detail-row" },
                    React.createElement(
                      "div",
                      { className: "detail-row-label" },
                      "明日计划"
                    ),
                    React.createElement(
                      "div",
                      { className: "detail-row-content" },
                      selected.plan || "未填写"
                    )
                  ),
                  formatReturn(selected) &&
                    React.createElement(
                      "div",
                      { className: "detail-row" },
                      React.createElement(
                        "div",
                        { className: "detail-row-label" },
                        "收益"
                      ),
                      React.createElement(
                        "div",
                        { className: "detail-row-content" },
                        formatReturn(selected)
                      )
                    ),
                  selectedPhotos.length
                    ? React.createElement(
                        "div",
                        { className: "detail-row" },
                        React.createElement(
                          "div",
                          { className: "detail-row-label" },
                          "截图 / 照片"
                        ),
                        React.createElement(
                          "div",
                          { className: "photos-grid" },
                          selectedPhotos.map((p) =>
                            React.createElement(
                              "div",
                              { key: p.id, className: "photo-thumb" },
                              React.createElement("img", {
                                src: p.url,
                                alt: p.desc || "复盘截图",
                              }),
                              React.createElement(
                                "div",
                                { className: "photo-thumb-caption" },
                                p.desc || "复盘截图"
                              )
                            )
                          )
                        )
                      )
                    : null,
                  React.createElement(
                    "div",
                    { className: "field-row" },
                    React.createElement(
                      "button",
                      {
                        type: "button",
                        className: "btn btn-ghost btn-sm",
                        onClick: () => onEdit(selected),
                      },
                      "编辑这条复盘"
                    )
                  )
                )
              )
          )
    );
  }

  // ---------- 根组件 ----------

  function App() {
    const [user, setUser] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [photosByReviewId, setPhotosByReviewId] = useState({});
    const [selectedId, setSelectedId] = useState(null);
    const [initializing, setInitializing] = useState(true);
    const [authReady, setAuthReady] = useState(false);
    const [headerLoading, setHeaderLoading] = useState(false);
    const [editingReview, setEditingReview] = useState(null);

    useEffect(() => {
      async function init() {
        try {
          ensureSupabase();
          const { data } = await supabaseClient.auth.getUser();
          if (data?.user) {
            setUser(data.user);
          }
        } catch (err) {
          console.error("初始化 Supabase 失败：", err);
        } finally {
          setInitializing(false);
          setAuthReady(true);
        }
      }
      init();
    }, []);

    useEffect(() => {
      if (!user) return;
      async function loadPhotos() {
        try {
          const client = ensureSupabase();
          const { data, error } = await client
            .from("review_photos")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          if (error) throw error;
          const grouped = {};
          (data || []).forEach((p) => {
            if (!grouped[p.review_id]) grouped[p.review_id] = [];
            grouped[p.review_id].push(p);
          });
          setPhotosByReviewId(grouped);
        } catch (err) {
          console.error("加载图片失败：", err);
        }
      }
      loadPhotos();
    }, [user]);

    async function handleLogout() {
      try {
        setHeaderLoading(true);
        const client = ensureSupabase();
        await client.auth.signOut();
        setUser(null);
        setReviews([]);
        setSelectedId(null);
        setEditingReview(null);
      } catch (err) {
        console.error("登出失败：", err);
      } finally {
        setHeaderLoading(false);
      }
    }

    function handleReviewCreated({ review, photo }) {
      setReviews((prev) => {
        const others = prev.filter((r) => r.id !== review.id);
        return [review, ...others].sort((a, b) =>
          a.date === b.date ? (b.created_at || "").localeCompare(a.created_at || "") : (b.date || "").localeCompare(a.date || "")
        );
      });
      if (photo) {
        setPhotosByReviewId((prev) => {
          const list = prev[photo.review_id] || [];
          return {
            ...prev,
            [photo.review_id]: [photo, ...list],
          };
        });
      }
      setEditingReview(null);
    }

    function handleSelect(id, freshList, fromLoad) {
      if (fromLoad && Array.isArray(freshList)) {
        setReviews(freshList);
        if (!freshList.length) {
          setSelectedId(null);
        } else {
          setSelectedId(freshList[0].id);
        }
        return;
      }
      setSelectedId(id);
    }

    if (!authReady || initializing) {
      return React.createElement(
        "div",
        { className: "auth-card" },
        React.createElement(
          "div",
          { className: "auth-title" },
          "正在加载复盘空间..."
        ),
        React.createElement(
          "div",
          { className: "auth-subtitle" },
          "首次加载可能需要几秒钟，请稍候。"
        )
      );
    }

    if (!user) {
      return React.createElement(AuthView, {
        onAuth: (u) => setUser(u),
      });
    }

    const initials =
      (user.email || "")
        .split("@")[0]
        .split(/[._]/)
        .map((s) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    return React.createElement(
      "div",
      { className: "app-shell" },
      React.createElement(
        "header",
        { className: "app-header" },
        React.createElement(
          "div",
          { className: "app-title" },
          React.createElement(
            "div",
            { className: "app-title-main" },
            "股市复盘笔记",
            React.createElement("span", { className: "pill" }, "跨端同步"),
            React.createElement(
              "span",
              { className: "badge-live" },
              React.createElement("span", { className: "dot" }),
              "Online"
            )
          ),
          React.createElement(
            "div",
            { className: "app-subtitle" },
            "手机和电脑同时记录，长期跟踪你的交易行为与心态变化。"
          )
        ),
        React.createElement(
          "div",
          { className: "header-actions" },
          React.createElement(
            "div",
            { className: "user-chip" },
            React.createElement("div", { className: "user-avatar" }, initials),
            React.createElement(
              "div",
              null,
              React.createElement(
                "div",
                { style: { fontSize: "11px" } },
                user.email || "未知用户"
              ),
              React.createElement(
                "div",
                { className: "muted" },
                "已登录 · 数据已云端同步"
              )
            )
          ),
          React.createElement(
            "button",
            {
              className: "btn btn-danger btn-sm",
              onClick: handleLogout,
              disabled: headerLoading,
            },
            "退出",
            headerLoading ? "..." : ""
          )
        )
      ),
      React.createElement(
        "main",
        { className: "app-body" },
        React.createElement(ReviewForm, {
          user,
          onCreated: handleReviewCreated,
          editing: editingReview,
          onCancelEdit: () => setEditingReview(null),
        }),
        React.createElement(ReviewList, {
          user,
          reviews,
          photosByReviewId,
          onSelect: handleSelect,
          selectedId,
          onEdit: (r) => setEditingReview(r),
        })
      )
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(React.createElement(App));
  });
})();

