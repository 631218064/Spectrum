---

## 项目需求：Spectrum 注册表单实现

### 全局规则
- **国际化**：所有界面文本需支持中英文，根据用户选择切换。`translations.ts` 文件需包含所有键值对。**所有描述文本、字段标签、选项、提示信息均需包含在内**。
- **[key] 规则**：`[key]` 即下方表格中的 **字段ID**。
- **必填**：所有字段均为必填/必选，提交前需验证；`custom` 类输入仅在选择 `custom` 后才必填。
- **注释**：代码需包含必要注释，尤其是联动逻辑和数据处理部分。
- **数据结构**：最终提交的表单数据需包含所有字段（`custom` 字段按条件提交），格式参考下方“最终实现版 Schema”。
- **时区规则**：年龄校验（18+）和“每日 8:00 解锁”均按**北京时间（Asia/Shanghai）**。
- **其他**：如果需要在 supabase 等你无法连接的地方操作，请在最后给出具体操作步骤与事项。

### 页面顶部欢迎语（需翻译）
- **中文**：欢迎来到 Spectrum！在开始这段慢揭晓之旅前，请先勾勒一个立体的你。你填写得越用心，未来五天关于你的谜题就越迷人，也越容易遇见真正懂你的人。所有信息都将严格保密，只有匹配成功后，才会以每日线索的形式部分揭示。
- **英文**：Welcome to Spectrum! Before embarking on this slow-reveal journey, take a moment to sketch a three-dimensional portrait of yourself. The more thoughtfully you fill this out, the more intriguing your mystery clues will be over the next five days—and the easier it will be to meet someone who truly understands you. All information is strictly confidential and will only be partially revealed as daily clues after a successful match.

---

### 照片墙（新增，位于第一部分上方）
**描述（需翻译）**：
- 中文：第一张图将作为你的主头像。匹配过程中，每天会解锁一张新照片（Day1解锁第一张，Day2解锁第二张，...，Day5解锁剩余全部）。
- 英文：The first photo will be your main avatar. During matching, one new photo will be unlocked each day (Day 1: photo 1, Day 2: photo 2, ..., Day 5: all remaining photos).

| 字段ID | 类型 | 标签（中/英） | 选项 / 说明 | 验证规则 |
|--------|------|---------------|-------------|----------|
| `photos` | 图片上传（照片墙） | 照片墙 / Photo Wall | 使用 Ant Design `Upload`（`listType=\"picture-card\"`），支持缩略图、删除、拖拽排序（按展示顺序存储） | 必填，1-10张；格式 JPG/PNG/HEIC；单张 <=10MB；第一张默认为主头像 |


---

### 第一部分：基础档案  
**描述（需翻译）**：  
- 中文：这一部分帮助我们构建你的基本画像，也是生成线索的底色。  
- 英文：This section helps us build your basic profile—the foundation for generating clues.

| 字段ID | 类型 | 标签（中/英） | 选项 / 说明 | 验证规则 |
|--------|------|---------------|-------------|----------|
| `nickname` | 文本输入 | 昵称 / Nickname | 用于匹配过程中显示 | 必填，1-20字符 |
| `birthday` | 日期选择 | 出生年月日 / Date of Birth | 选择年、月、日 | 必填，需为过去日期，且年龄 `18+`（北京时间） |
| `gender` | 单选 | 性别 / Gender | `male`（男 / Male）<br>`female`（女 / Female）<br>`non_binary`（非二元 / Non-binary）<br>`prefer_not_to_say`（不愿透露 / Prefer not to say） | 必选 |
| `sexual_orientation` | 单选 | 性取向 / Sexual Orientation | `heterosexual`（异性恋 / Heterosexual）<br>`homosexual`（同性恋 / Homosexual）<br>`bisexual`（双性恋 / Bisexual）<br>`pansexual`（泛性恋 / Pansexual）<br>`queer`（酷儿 / Queer）<br>`exploring`（其他/仍在探索 / Other / Exploring） | 必选 |
| `location` | 联动选择 | 所在城市 / Location | 1. 先选择国家；若国家为中国（`CN`），继续选择省份、城市（三级联动）。<br>2. 若为其他国家，仅选择国家（一级）。<br>3. 使用静态 `cities.json`。 | 必选到对应级别；不允许空值 |
| `mbti` | 下拉选择 | MBTI 类型 / MBTI Type | 标准16型（如 `INTJ`、`INFP`），加 `unknown`（暂不了解，但愿意探索） | 必选 |
| `zodiac` | 下拉选择 | 星座 / Zodiac | 标准12星座 | 必选 |
| `growth_environment` | 单选 | 成长环境 / Childhood Environment | `happy_family`（家庭幸福 / Happy family）<br>`independent`（独立成长 / Independent）<br>`complex`（情况复杂 / Complex）<br>`prefer_not_to_say`（不想说 / Prefer not to say） | 必选 |
| `financial_status` | 单选 | 经济情况 / Financial Status | `student`（学生 / Student）<br>`employed`（上班族 / Employed）<br>`self_employed`（自由职业 / Self-employed）<br>`prefer_not_to_say`（不想说 / Prefer not to say） | 必选 |
| `education` | 单选 | 学历 / Education | `high_school`（高中及以下 / High school or below）<br>`associate`（专科 / Associate degree）<br>`bachelor`（本科 / Bachelor‘s degree）<br>`master`（硕士 / Master’s degree）<br>`doctor`（博士 / Doctorate）<br>`prefer_not_to_say`（不想说 / Prefer not to say） | 必选 |
| `pet_preference` | 单选 | 宠物偏好 / Pet Preference | `cat`（猫派 / Cat person）<br>`dog`（狗派 / Dog person）<br>`other_pet`（其他小动物派 / Other small pets）<br>`no_pet_now`（目前没养，但对宠物无感 / Don't have one now, but fine with pets）<br>`allergic`（对动物过敏或害怕 / Allergic or afraid） | 必选 |
| `hobbies` | 多选（最多5项） | 兴趣爱好 / Hobbies | 选项见下方列表，含 `custom`（需输入框） | 至少1项，最多5项；`custom` 计入上限 |

**兴趣爱好选项**（键值对应）：
- `reading_writing`：阅读/写作 / Reading & Writing
- `movies_tv`：电影/剧集 / Movies & TV
- `music_instruments`：音乐/乐器 / Music & Instruments
- `games`：游戏/桌游 / Games & Board Games
- `sports_fitness`：运动/健身 / Sports & Fitness
- `travel_food`：旅行/探店 / Travel & Food Hunting
- `photography_art`：摄影/绘画 / Photography & Art
- `crafts_baking`：手工/烘焙 / Crafts & Baking
- `outdoors_camping`：户外/露营 / Outdoors & Camping
- `home_relax`：宅家/放松 / Staying In & Relaxing
- `custom`：其他（可输入） / Other (custom)

---

### 第二部分：感官与直觉  
**描述（需翻译）**：  
- 中文：这些问题没有对错，只有你独特的感知世界的方式。它们会成为第一天线索的灵感来源。  
- 英文：There are no right or wrong answers—only your unique way of perceiving the world. These will inspire the first day's clues.

| 字段ID | 类型 | 标签（中/英） | 选项 / 说明 | 验证规则 |
|--------|------|---------------|-------------|----------|
| `sound_preference` | 单选 | 声音的偏好 / Sound Preference | `rain_fireplace`（雨天白噪音或壁炉声）<br>`cafe_clatter`（咖啡馆交谈与杯碟声）<br>`instrumental`（钢琴或小提琴纯器乐）<br>`livehouse_rap`（Livehouse Rap） | 必选 |
| `color_mood` | 单选+自定义 | 色彩的共鸣 / Color Resonance | `warm_gold`<br>`calm_blue`<br>`chaotic_gray`<br>`mysterious_purple`<br>`custom` | 必选；选 `custom` 时 `color_mood_custom` 必填 |
| `scent_memory` | 单选+自定义 | 气味记忆 / Scent Memory | `home_cooking`<br>`rain_grass`<br>`old_books`<br>`pool_sea`<br>`perfume`<br>`not_sensitive`<br>`custom` | 必选；选 `custom` 时 `scent_memory_custom` 必填 |

---

### 第三部分：生活仪式感与“怪癖”  
**描述（需翻译）**：  
- 中文：正是这些微小而确定的习惯，构成了独一无二的你。我们会把你的某个习惯变成第三天的谜题。  
- 英文：It's these small, definite habits that make you uniquely you. One of your rituals will become the third day's mystery.

| 字段ID | 类型 | 标签（中/英） | 选项 / 说明 | 验证规则 |
|--------|------|---------------|-------------|----------|
| `ritual` | 单选+自定义 | 你的微小仪式感 / Your Little Ritual | `wipe_cup`<br>`couch_5min`<br>`prepare_clothes`<br>`music_shower`<br>`no_ritual`<br>`custom` | 必选；选 `custom` 时 `ritual_custom` 必填 |
| `food_adventure` | 单选 | 味觉冒险地图 / Food Adventure Style | `safe_guard`<br>`mild_explorer`<br>`extreme_explorer`<br>`survival` | 必选 |

---

### 第四部分：关系信念与情感模式  
**描述（需翻译）**：  
- 中文：我们对待亲密关系的方式，往往藏在一些瞬间的选择里。这部分将帮助我们寻找与你情感节奏同频的人。  
- 英文：How we approach intimacy is often revealed in split-second choices. This section helps us find someone who syncs with your emotional rhythm.

| 字段ID | 类型 | 标签（中/英） | 选项 / 说明 | 验证规则 |
|--------|------|---------------|-------------|----------|
| `conflict_reaction` | 单选 | 冲突之后的你 / After a Conflict | `need_space`<br>`talk_immediately`<br>`pretend_fine`<br>`depends` | 必选 |
| `recharge_style` | 单选 | 爱的充电站 / Recharge Style | `deep_talk`<br>`alone_time`<br>`quality_time`<br>`friends_social` | 必选 |

---

### 第五部分：留给未来的 TA  
**描述（需翻译）**：  
- 中文：这是你亲手种下的彩蛋。给未来的匹配对象留一个无伤大雅的小谜题，这个问题将在第一天解锁。  
- 英文：This is your personal easter egg. Leave a lighthearted riddle for your future match—it will be unlocked on the first day.

| 字段ID | 类型 | 标签（中/英） | 说明 | 验证规则 |
|--------|------|---------------|------|----------|
| `mystery_question` | 文本输入 | 我的谜题 / My Mystery Question | 开放式问题 | 必填，不超过50字 |
| `mystery_answer` | 文本输入 | 我的答案 / My Answer | 该问题答案，仅系统可见 | 必填，不超过100字 |

---

### 第六部分：理想型与期待  
**描述（需翻译）**：  
- 中文：虽然我们相信真爱超越条条框框，但你的偏好能帮助我们更精准地推荐。  
- 英文：While we believe true love transcends checkboxes, your preferences help us make more accurate recommendations.

| 字段ID | 类型 | 标签（中/英） | 选项 / 说明 | 验证规则 |
|--------|------|---------------|-------------|----------|
| `valued_traits` | 多选（最多3项） | 最看重的三个特质 / Top 3 Valued Traits | `humor`<br>`gentle`<br>`ambitious`<br>`intelligent`<br>`independent`<br>`romantic`<br>`sincere`<br>`patient`<br>`loves_life`<br>`good_looking`<br>`financially_stable`<br>`loves_animals`<br>`family_oriented`<br>`custom` | 至少1项，最多3项；`custom` 计入上限；选 `custom` 时 `valued_traits_custom` 必填 |
| `relationship_goal` | 多选（最多2项） | 你期待在这段关系中收获什么？ / What are you looking for? | `stable_partner`<br>`deep_connection`<br>`playmate`<br>`healing`<br>`no_expectations` | 至少1项，最多2项 |

---

### 第七部分：隐私与设置  
**描述（需翻译）**：  
- 中文：控制你的匹配体验。  
- 英文：Control your matching experience.

| 字段ID | 类型 | 标签（中/英） | 选项 / 说明 | 验证规则 |
|--------|------|---------------|-------------|----------|
| `contact_info` | 文本输入 | 联系方式 / Contact Info | 如微信号、其他社交账号，第五天自动公开 | 必填；仅校验非空 |
| `agree_terms` | 复选框 | 同意条款 / Agree to Terms | 我已阅读并同意《用户协议》和《隐私政策》 | 必须勾选 |

---

### 提交按钮下方文本（需翻译）
- **中文**：点击提交后，你将成为 Spectrum 的一员。我们会尽快为你寻找调性相合的匹配对象，并在每天早晨 8:00（北京时间）解锁 3-5 条关于对方的独特线索。祝你在慢揭晓中，遇见惊喜。
- **英文**：After submitting, you'll become a member of Spectrum. We'll soon start matching you with like-minded individuals, and every morning at 8:00 (Beijing Time) you'll unlock 3-5 unique clues about them. May you encounter delightful surprises in this slow reveal.

---

### 最终实现版 Schema（提交结构）

```json
{
  "nickname": "Aster",
  "birthday": "2000-01-01",
  "gender": "female",
  "sexual_orientation": "queer",
  "location": {
    "country": "CN",
    "province": "GD",
    "city": "SZ"
  },
  "mbti": "INFP",
  "zodiac": "pisces",
  "growth_environment": "happy_family",
  "financial_status": "employed",
  "education": "bachelor",
  "pet_preference": "cat",
  "hobbies": ["reading_writing", "movies_tv", "custom"],
  "hobbies_custom": "观鸟",
  "sound_preference": "rain_fireplace",
  "color_mood": "custom",
  "color_mood_custom": "雾蓝",
  "scent_memory": "old_books",
  "ritual": "custom",
  "ritual_custom": "睡前整理书桌",
  "food_adventure": "mild_explorer",
  "conflict_reaction": "depends",
  "recharge_style": "alone_time",
  "mystery_question": "猜猜我最不擅长什么运动？",
  "mystery_answer": "羽毛球",
  "valued_traits": ["humor", "gentle", "custom"],
  "valued_traits_custom": "边界感",
  "relationship_goal": ["deep_connection", "stable_partner"],
  "photos": [
    "https://your-project.supabase.co/storage/v1/object/public/profiles/xxx_1.jpg",
    "https://your-project.supabase.co/storage/v1/object/public/profiles/xxx_2.jpg"
  ],
  "avatar_filter": "blur",
  "contact_info": "wechat_abc123",
  "agree_terms": true
}，
  "contact_info": "wechat_abc123",
  "agree_terms": true
}
```

**location 条件结构**：
- 当 `location.country = "CN"`：必须包含 `country` + `province` + `city`，且都不能为空。
- 当 `location.country != "CN"`：仅包含 `country`，且不能为空；不提交 `province`、`city`。

**custom 字段规则**：
- 仅在选择对应 `custom` 时提交并必填（如 `hobbies_custom`、`color_mood_custom`、`scent_memory_custom`、`ritual_custom`、`valued_traits_custom`）。

**photos 字段规则**：
- 提交结构为字符串数组：`photos: string[]`。
- 当前版本允许 `1-10` 张图片。
- 数组顺序即照片墙当前展示顺序（拖拽排序后顺序）。
- 数组元素为上传成功后的公开 URL。

---

### 附录：城市联动数据格式要求

请提供一个静态 JSON 文件 `cities.json`，结构如下：

```json
{
  "countries": [
    {
      "code": "CN",
      "name": "中国",
      "name_en": "China",
      "provinces": [
        {
          "code": "BJ",
          "name": "北京市",
          "name_en": "Beijing",
          "cities": [
            { "code": "BJ001", "name": "北京市", "name_en": "Beijing" }
          ]
        },
        {
          "code": "GD",
          "name": "广东省",
          "name_en": "Guangdong",
          "cities": [
            { "code": "GZ", "name": "广州市", "name_en": "Guangzhou" },
            { "code": "SZ", "name": "深圳市", "name_en": "Shenzhen" }
          ]
        }
      ]
    },
    {
      "code": "US",
      "name": "美国",
      "name_en": "United States",
      "provinces": []
    }
  ]
}
```

**逻辑**：
- 用户先选国家；若国家代码为 `"CN"`，显示省份下拉；选中省份后显示城市下拉。
- 其他国家不显示省份/城市下拉，仅保存国家代码。

---

### 注意事项
- 表单提交时，所有字段值应使用上述键值（如 `gender: "male"`）。
- 照片墙中的第一张图片默认为主头像（`photos[0]`）。
- `custom` 输入框显示逻辑必须由对应选项控制。
- 验证规则需在前端和后端同时实施（后端可简化，但必填与关键格式必须保证）。
- 所有 UI 展示文本（模块描述、选项文案、提示）均需纳入翻译。
- `photos` 需在前后端同时校验格式与大小（JPG/PNG/HEIC，单张 <=10MB），并支持拖拽排序、预览与删除。
- 前端交互需保证分步引导、错误提示、草稿防丢、移动端适配、步骤切换平滑动画与提交后的完成反馈。