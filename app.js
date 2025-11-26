// 数据定义
const appData = {
    systemStatus: {
        lastUpdate: "加载中...",
        totalMembers: 0,
        totalContents: 0
    },
    stats: {
        activeMembers: 0,
        todayContents: 0,
        todayAchievements: 0,
        averageLevel: "L0.0"
    },
    ratingDistribution: {},
    topMembers: [],
    topAchievements: [],
    memberRankings: [],
    achievementRankings: [],
    contentRankings: [],
    achievementList: [],
    currentMemberPage: 1,
    memberPageSize: 10,
    memberTotalCount: 0,
    currentContentPage: 1,
    contentPageSize: 10,
    contentTotalCount: 0,
    currentSearch: {
        keyword: '',
        domain: '',
        isSearching: false
    }
};

// 工具函数
const utils = {
    getLevelBadgeClass(level) {
        if (!level) return "level-badge bg-secondary";
        const levelNum = parseInt(level.replace('L', ''));
        return `level-badge level-l${levelNum}`;
    },

    getLevelText(level) {
        if (!level) return "未评级";
        const levelNum = parseInt(level.replace('L', ''));
        const levels = {
            1: "L1 新手",
            2: "L2 进阶",
            3: "L3 专家",
            4: "L4 大师",
            5: "L5 传奇"
        };
        return levels[levelNum] || level;
    },

    getDomainBadgeClass(domain) {
        if (!domain) return "bg-secondary";
        const classes = {
            "Web开发": "bg-primary",
            "前端开发": "bg-info",
            "后端开发": "bg-success",
            "数据科学": "bg-warning",
            "人工智能": "bg-secondary",
            "移动开发": "bg-info",
            "云计算与运维": "bg-dark",
            "产品管理": "bg-secondary",
            "视觉设计": "bg-danger"
        };
        return classes[domain] || "bg-secondary";
    },

    formatNumber(num) {
        if (num === null || num === undefined) return "0";
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    formatDate(dateString) {
        if (!dateString) return "未知";
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },

    // 格式化完整日期时间
    formatDateTime(dateString) {
        if (!dateString) return "未知";
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },

    // 生成头像背景色
    getAvatarColor(name) {
        const colors = [
            'bg-primary', 'bg-success', 'bg-info', 'bg-warning',
            'bg-danger', 'bg-secondary', 'bg-dark'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    },

    // 获取成就排名徽章类
    getAchievementRankBadgeClass(rank) {
        if (rank === 1) return "achievement-rank-badge rank-1";
        if (rank === 2) return "achievement-rank-badge rank-2";
        if (rank === 3) return "achievement-rank-badge rank-3";
        return "achievement-rank-badge rank-other";
    },

    // 格式化完成率为百分比
    formatCompletionRate(rate) {
        if (rate === null || rate === undefined) return "0%";
        return (rate * 100).toFixed(1) + "%";
    },

    // 格式化百分比（用于评级分布）
    formatPercentage(value) {
        if (value === null || value === undefined) return "0%";
        return value.toFixed(1) + "%";
    },

    // 获取评级分布颜色
    getDistributionColor(level) {
        const colors = {
            "L1": "#6c757d",
            "L2": "#198754",
            "L3": "#0dcaf0",
            "L4": "#ffc107",
            "L5": "#fd7e14"
        };
        return colors[level] || "#6c757d";
    }
};

// API服务 - 各接口独立，互不耦合
const apiService = {
    // 系统概览接口
    async fetchSystemOverview() {
        try {
            const response = await fetch('http://localhost:8081/api/SystemOverview');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.code === 200) {
                return data.data;
            } else {
                throw new Error(data.message || 'API返回错误');
            }
        } catch (error) {
            console.error('获取系统概览数据失败:', error);
            throw error;
        }
    },

    // 成员排名接口
    async fetchMemberRanking(params = {}) {
        try {
            // 构建查询参数
            const queryParams = new URLSearchParams();

            if (params.count) queryParams.append('count', params.count);
            if (params.domain) queryParams.append('domain', params.domain);
            if (params.sort_by) queryParams.append('sort_by', params.sort_by);

            const url = `http://localhost:8081/api/Member/ranking${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.code === 200) {
                return data.data;
            } else {
                throw new Error(data.message || 'API返回错误');
            }
        } catch (error) {
            console.error('获取成员排名数据失败:', error);
            throw error;
        }
    },

    // 单个成员查询接口
    async fetchMemberDetail(memberId) {
        try {
            const response = await fetch(`http://localhost:8081/api/Member/${memberId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.code === 200) {
                return data.data; // 注意：如果成员不存在，data.data为null
            } else {
                throw new Error(data.message || 'API返回错误');
            }
        } catch (error) {
            console.error('获取成员详情失败:', error);
            throw error;
        }
    },

    // 成员搜索接口
    async fetchMemberSearch(params = {}) {
        try {
            // 构建查询参数
            const queryParams = new URLSearchParams();

            if (params.keyword) queryParams.append('keyword', params.keyword);
            if (params.domain) queryParams.append('domain', params.domain);
            if (params.count) queryParams.append('count', params.count);

            const url = `http://localhost:8081/api/Member/search${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.code === 200) {
                return data.data;
            } else {
                throw new Error(data.message || 'API返回错误');
            }
        } catch (error) {
            console.error('搜索成员失败:', error);
            throw error;
        }
    },

    // 内容排名接口
    async fetchContentRanking(params = {}) {
        try {
            // 构建查询参数
            const queryParams = new URLSearchParams();

            if (params.count) queryParams.append('count', params.count);
            if (params.sort_order) queryParams.append('sort_order', params.sort_order);

            const url = `http://localhost:8081/api/Content/getContentRanking${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.code === 200) {
                return data.data;
            } else {
                throw new Error(data.message || 'API返回错误');
            }
        } catch (error) {
            console.error('获取内容排名数据失败:', error);
            throw error;
        }
    },

    // 单个内容查询接口
    async fetchContentDetail(contentId) {
        try {
            const response = await fetch(`http://localhost:8081/api/Content/searchContent?content_id=${contentId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.code === 200) {
                return data.data;
            } else {
                throw new Error(data.message || 'API返回错误');
            }
        } catch (error) {
            console.error('获取内容详情失败:', error);
            throw error;
        }
    },

    // 成就清单接口
    async fetchAchievementList() {
        try {
            const response = await fetch('http://localhost:8081/api/Achievement/getAchievementList');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.code === 200) {
                return data.data;
            } else {
                throw new Error(data.message || 'API返回错误');
            }
        } catch (error) {
            console.error('获取成就清单失败:', error);
            throw error;
        }
    },

    // 成就排名接口
    async fetchAchievementRanking(params = {}) {
        try {
            // 构建查询参数
            const queryParams = new URLSearchParams();

            if (params.count) queryParams.append('count', params.count);
            if (params.sort_order) queryParams.append('sort_order', params.sort_order);

            const url = `http://localhost:8081/api/Achievement/getAchievementRanking${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.code === 200) {
                return data.data;
            } else {
                throw new Error(data.message || 'API返回错误');
            }
        } catch (error) {
            console.error('获取成就排名数据失败:', error);
            throw error;
        }
    },

    // 转换API数据为应用内部格式 - 系统概览
    transformSystemOverviewData(apiData) {
        // 更新系统状态
        appData.systemStatus = {
            lastUpdate: utils.formatDateTime(apiData.lastUpdateTime),
            totalMembers: apiData.totalMembers,
            totalContents: apiData.totalContents
        };

        // 更新统计数据
        appData.stats = {
            activeMembers: apiData.activeMembers,
            todayContents: apiData.newContentsToday,
            todayAchievements: apiData.newAchievementsToday,
            averageLevel: apiData.averageRating
        };

        // 更新评级分布数据
        appData.ratingDistribution = apiData.ratingDistribution || {};

        // 转换Top成员数据 - 确保只取前5个
        appData.topMembers = (apiData.topMembers || []).slice(0, 5).map(member => ({
            name: member.memberName,
            level: member.level,
            score: member.score,
            domain: member.mainDomain,
            memberId: member.memberId
        }));

        // 转换Top成就数据 - 使用API返回的真实数据
        appData.topAchievements = (apiData.topAchievements || []).slice(0, 5).map(achievement => ({
            rank: achievement.rank,
            name: achievement.achievementName,
            count: achievement.achievementCount,
            completionRate: achievement.completionRate,
            key: achievement.achievementKey
        }));

        // 同时更新成就排名数据
        appData.achievementRankings = (apiData.topAchievements || []).map(achievement => ({
            rank: achievement.rank,
            name: achievement.achievementName,
            count: achievement.achievementCount,
            completionRate: achievement.completionRate,
            key: achievement.achievementKey
        }));
    },

    // 转换成员排名数据
    transformMemberRankingData(apiData) {
        appData.memberRankings = (apiData || []).map(member => ({
            id: member.member_id,
            name: member.member_name,
            rank: member.rank,
            domain: member.main_domain,
            level: member.level,
            score: member.score,
            joinTime: member.join_time
        }));

        // 更新总成员数（用于分页）
        appData.memberTotalCount = apiData.length;
    },

    // 转换成员详情数据
    transformMemberDetailData(apiData) {
        if (!apiData || apiData.length === 0) return null;

        const memberData = apiData[0];
        return {
            id: memberData.member_id,
            name: memberData.member_name,
            rank: memberData.rank,
            domain: memberData.main_domain,
            level: memberData.level,
            score: memberData.score,
            joinTime: memberData.join_time,
            scoreHistory: memberData.score_history || []
        };
    },

    // 转换搜索成员数据
    transformMemberSearchData(apiData) {
        return (apiData || []).map(member => ({
            id: member.member_id,
            name: member.member_name,
            rank: member.rank,
            domain: member.main_domain,
            level: member.level,
            score: member.score,
            joinTime: member.join_time
        }));
    },

    // 转换内容排名数据
    transformContentRankingData(apiData) {
        appData.contentRankings = (apiData || []).map(content => ({
            id: content.contentId,
            authorId: content.authorId,
            authorName: content.authorName,
            publishTime: content.publishTime,
            domain: content.domain,
            score: content.score,
            likes: content.likes,
            unlikes: content.unlikes,
            comments: content.comments,
            shares: content.shares,
            rank: content.rank
        }));

        // 更新总内容数（用于分页）
        appData.contentTotalCount = apiData.length;
    },

    // 转换内容详情数据
    transformContentDetailData(apiData) {
        if (!apiData) return null;

        return {
            id: apiData.contentId,
            authorId: apiData.authorId,
            authorName: apiData.authorName,
            publishTime: apiData.publishTime,
            domain: apiData.domain,
            score: apiData.score,
            likes: apiData.likes,
            unlikes: apiData.unlikes,
            comments: apiData.comments,
            shares: apiData.shares,
            rank: apiData.rank
        };
    },

    // 转换成就清单数据
    transformAchievementListData(apiData) {
        appData.achievementList = (apiData || []).map(achievement => ({
            key: achievement.achievementKey,
            name: achievement.name,
            description: achievement.description,
            category: achievement.category,
            completionRate: achievement.completionRate,
            achievedCount: achievement.achievedCount,
            rank: achievement.rank
        }));
    },

    // 转换成就排名数据
    transformAchievementRankingData(apiData) {
        appData.achievementRankings = (apiData || []).map(achievement => ({
            rank: achievement.rank,
            name: achievement.name,
            count: achievement.achievedCount,
            completionRate: achievement.completionRate,
            key: achievement.achievementKey,
            description: achievement.description,
            category: achievement.category
        }));
    }
};

// 页面渲染函数
const render = {
    // 渲染系统状态
    systemStatus() {
        document.getElementById('lastUpdate').textContent = appData.systemStatus.lastUpdate;
        document.getElementById('totalMembers').textContent = utils.formatNumber(appData.systemStatus.totalMembers);
        document.getElementById('totalContents').textContent = utils.formatNumber(appData.systemStatus.totalContents);
    },

    // 渲染统计卡片
    statCards() {
        const statCards = [
            {
                title: "活跃成员",
                value: appData.stats.activeMembers,
                icon: "fas fa-users",
                gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            },
            {
                title: "今日新内容",
                value: appData.stats.todayContents,
                icon: "fas fa-file-alt",
                gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            },
            {
                title: "今日成就",
                value: appData.stats.todayAchievements,
                icon: "fas fa-trophy",
                gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            },
            {
                title: "平均评级",
                value: appData.stats.averageLevel,
                icon: "fas fa-star",
                gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            }
        ];

        const container = document.getElementById('statCards');
        container.innerHTML = '';

        statCards.forEach(card => {
            const cardHTML = `
                        <div class="col-md-3">
                            <div class="stat-card" style="background: ${card.gradient}">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6>${card.title}</h6>
                                        <h3>${utils.formatNumber(card.value)}</h3>
                                    </div>
                                    <i class="${card.icon} fa-2x opacity-50"></i>
                                </div>
                            </div>
                        </div>
                    `;
            container.innerHTML += cardHTML;
        });
    },

    // 渲染评级分布
    ratingDistribution() {
        const container = document.getElementById('ratingDistribution');
        container.innerHTML = '';

        if (!appData.ratingDistribution || Object.keys(appData.ratingDistribution).length === 0) {
            container.innerHTML = `
                        <div class="text-center text-muted py-3">
                            <i class="fas fa-chart-pie fa-2x mb-2"></i>
                            <div>暂无评级分布数据</div>
                        </div>
                    `;
            return;
        }

        let distributionHTML = '';
        const levels = ['L1', 'L2', 'L3', 'L4', 'L5'];

        levels.forEach(level => {
            const percentage = appData.ratingDistribution[level] || 0;
            const color = utils.getDistributionColor(level);
            const levelText = utils.getLevelText(level);

            distributionHTML += `
                        <div class="distribution-item d-flex align-items-center">
                            <div class="distribution-level">${levelText}</div>
                            <div class="flex-grow-1 mx-3">
                                <div class="distribution-bar" style="background-color: ${color}; width: ${percentage}%"></div>
                            </div>
                            <div class="distribution-percentage">${utils.formatPercentage(percentage)}</div>
                        </div>
                    `;
        });

        container.innerHTML = distributionHTML;
    },

    // 渲染Top成员列表 - 确保只显示5个
    topMembersList() {
        const container = document.getElementById('topMembersList');
        container.innerHTML = '';

        if (appData.topMembers.length === 0) {
            container.innerHTML = `
                        <div class="list-group-item text-center text-muted py-4">
                            <i class="fas fa-users fa-2x mb-2"></i>
                            <div>暂无成员数据</div>
                        </div>
                    `;
            return;
        }

        // 确保只显示前5个成员
        const top5Members = appData.topMembers.slice(0, 5);

        top5Members.forEach((member, index) => {
            const itemHTML = `
                        <div class="list-group-item d-flex justify-content-between align-items-center ranking-item">
                            <div class="d-flex align-items-center">
                                <div class="member-avatar ${utils.getAvatarColor(member.name)} me-3">
                                    ${member.name.charAt(0)}
                                </div>
                                <div>
                                    <div class="d-flex align-items-center">
                                        <span class="badge ${utils.getLevelBadgeClass(member.level)} me-2">${utils.getLevelText(member.level)}</span>
                                        <strong>${member.name}</strong>
                                    </div>
                                    <small class="text-muted">${member.domain}</small>
                                </div>
                            </div>
                            <span class="text-primary">${utils.formatNumber(member.score)}分</span>
                        </div>
                    `;
            container.innerHTML += itemHTML;
        });
    },

    // 渲染Top成就列表 - 使用API返回的真实数据
    topAchievementsList() {
        const container = document.getElementById('topAchievementsList');
        container.innerHTML = '';

        if (appData.topAchievements.length === 0) {
            container.innerHTML = `
                        <div class="list-group-item text-center text-muted py-4">
                            <i class="fas fa-trophy fa-2x mb-2"></i>
                            <div>暂无成就数据</div>
                        </div>
                    `;
            return;
        }

        appData.topAchievements.forEach((achievement, index) => {
            const badgeColors = ["bg-warning", "bg-secondary", "bg-primary", "bg-success", "bg-info"];
            const itemHTML = `
                        <div class="list-group-item d-flex justify-content-between align-items-center ranking-item">
                            <div class="d-flex align-items-center">
                                <div class="achievement-rank-badge ${utils.getAchievementRankBadgeClass(achievement.rank)} me-3">
                                    ${achievement.rank}
                                </div>
                                <div>
                                    <strong>${achievement.name}</strong>
                                    <small class="text-muted d-block">${utils.formatNumber(achievement.count)}人完成</small>
                                </div>
                            </div>
                            <span class="text-success">${utils.formatCompletionRate(achievement.completionRate)}</span>
                        </div>
                    `;
            container.innerHTML += itemHTML;
        });
    },

    // 渲染成员排名表格
    memberRankingTable() {
        const container = document.getElementById('memberRankingTable');
        container.innerHTML = '';

        if (appData.memberRankings.length === 0) {
            container.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center text-muted py-4">
                                <i class="fas fa-users fa-2x mb-2"></i>
                                <div>${appData.currentSearch.isSearching ? '未找到匹配的成员' : '暂无成员排名数据'}</div>
                            </td>
                        </tr>
                    `;
            return;
        }

        // 计算当前页数据的起始索引
        const startIndex = (appData.currentMemberPage - 1) * appData.memberPageSize;
        const endIndex = Math.min(startIndex + appData.memberPageSize, appData.memberRankings.length);
        const currentPageData = appData.memberRankings.slice(startIndex, endIndex);

        currentPageData.forEach((member, index) => {
            const actualRank = startIndex + index + 1;

            const rowHTML = `
                        <tr>
                            <td>${member.rank || actualRank}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="member-avatar ${utils.getAvatarColor(member.name)} me-2">
                                        ${member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div>${member.name}</div>
                                        <small class="text-muted">ID: ${member.id}</small>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="badge ${utils.getDomainBadgeClass(member.domain)}">${member.domain || '未设置'}</span>
                            </td>
                            <td><span class="badge ${utils.getLevelBadgeClass(member.level)}">${utils.getLevelText(member.level)}</span></td>
                            <td>${utils.formatNumber(member.score)}</td>
                            <td>${utils.formatDate(member.joinTime)}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary view-detail" data-member-id="${member.id}" data-member-name="${member.name}">
                                    <i class="fas fa-eye"></i> 详情
                                </button>
                            </td>
                        </tr>
                    `;
            container.innerHTML += rowHTML;
        });
    },

    // 渲染成员排名分页
    memberRankingPagination() {
        const container = document.getElementById('memberPagination');
        container.innerHTML = '';

        const totalPages = Math.ceil(appData.memberRankings.length / appData.memberPageSize);

        if (totalPages <= 1) return;

        // 上一页按钮
        const prevDisabled = appData.currentMemberPage <= 1 ? 'disabled' : '';
        const prevHTML = `
                    <li class="page-item ${prevDisabled}">
                        <a class="page-link" href="#" data-page="${appData.currentMemberPage - 1}">上一页</a>
                    </li>
                `;
        container.innerHTML += prevHTML;

        // 页码按钮
        for (let i = 1; i <= totalPages; i++) {
            const active = i === appData.currentMemberPage ? 'active' : '';
            const pageHTML = `
                        <li class="page-item ${active}">
                            <a class="page-link" href="#" data-page="${i}">${i}</a>
                        </li>
                    `;
            container.innerHTML += pageHTML;
        }

        // 下一页按钮
        const nextDisabled = appData.currentMemberPage >= totalPages ? 'disabled' : '';
        const nextHTML = `
                    <li class="page-item ${nextDisabled}">
                        <a class="page-link" href="#" data-page="${appData.currentMemberPage + 1}">下一页</a>
                    </li>
                `;
        container.innerHTML += nextHTML;
    },

    // 渲染搜索结果显示
    renderSearchResultsHeader() {
        const header = document.getElementById('searchResultsHeader');
        const textElement = document.getElementById('searchResultsText');

        if (appData.currentSearch.isSearching) {
            const keyword = appData.currentSearch.keyword;
            const domain = appData.currentSearch.domain;
            let searchText = `搜索关键词: "${keyword}"`;

            if (domain) {
                searchText += ` | 领域: ${domain}`;
            }

            searchText += ` | 找到 ${appData.memberRankings.length} 个成员`;

            textElement.textContent = searchText;
            header.classList.remove('d-none');
        } else {
            header.classList.add('d-none');
        }
    },

    // 渲染成就清单
    achievementList() {
        const container = document.getElementById('achievementCategories');
        container.innerHTML = '';

        if (appData.achievementList.length === 0) {
            container.innerHTML = `
                        <div class="col-12 text-center text-muted py-4">
                            <i class="fas fa-trophy fa-2x mb-2"></i>
                            <div>暂无成就数据</div>
                        </div>
                    `;
            return;
        }

        // 按类别分组成就
        const categories = {};
        appData.achievementList.forEach(achievement => {
            if (!categories[achievement.category]) {
                categories[achievement.category] = [];
            }
            categories[achievement.category].push(achievement);
        });

        let categoriesHTML = '';
        Object.keys(categories).forEach(category => {
            const achievements = categories[category];

            const categoryHTML = `
                        <div class="col-md-6 mb-4">
                            <h6>${category}类成就</h6>
                            <div class="list-group">
                                ${achievements.map(achievement => `
                                    <div class="list-group-item">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div class="flex-grow-1">
                                                <h6 class="mb-1">${achievement.name}</h6>
                                                <p class="mb-1 text-muted small">${achievement.description}</p>
                                                <div class="d-flex justify-content-between align-items-center mt-2">
                                                    <small class="text-muted">完成率: ${utils.formatCompletionRate(achievement.completionRate)}</small>
                                                    <small class="text-muted">${utils.formatNumber(achievement.achievedCount)}人完成</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
            categoriesHTML += categoryHTML;
        });

        container.innerHTML = categoriesHTML;
    },

    // 渲染内容排名表格
    contentRankingTable() {
        const container = document.getElementById('contentRankingTable');
        container.innerHTML = '';

        if (appData.contentRankings.length === 0) {
            container.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center text-muted py-4">
                                <i class="fas fa-file-alt fa-2x mb-2"></i>
                                <div>暂无内容排名数据</div>
                            </td>
                        </tr>
                    `;
            return;
        }

        // 计算当前页数据的起始索引
        const startIndex = (appData.currentContentPage - 1) * appData.contentPageSize;
        const endIndex = Math.min(startIndex + appData.contentPageSize, appData.contentRankings.length);
        const currentPageData = appData.contentRankings.slice(startIndex, endIndex);

        currentPageData.forEach((content, index) => {
            const actualRank = startIndex + index + 1;

            const rowHTML = `
                        <tr>
                            <td>${content.rank || actualRank}</td>
                            <td>${content.id}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="member-avatar ${utils.getAvatarColor(content.authorName)} me-2">
                                        ${content.authorName.charAt(0)}
                                    </div>
                                    <div>
                                        <div>${content.authorName}</div>
                                        <small class="text-muted">ID: ${content.authorId}</small>
                                    </div>
                                </div>
                            </td>
                            <td>${utils.formatDateTime(content.publishTime)}</td>
                            <td>
                                <span class="badge ${utils.getDomainBadgeClass(content.domain)}">${content.domain}</span>
                            </td>
                            <td>${utils.formatNumber(content.score)}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary view-content-detail" data-content-id="${content.id}">
                                    <i class="fas fa-eye"></i> 详情
                                </button>
                            </td>
                        </tr>
                    `;
            container.innerHTML += rowHTML;
        });
    },

    // 渲染内容排名分页
    contentRankingPagination() {
        const container = document.getElementById('contentPagination');
        container.innerHTML = '';

        const totalPages = Math.ceil(appData.contentRankings.length / appData.contentPageSize);

        if (totalPages <= 1) return;

        // 上一页按钮
        const prevDisabled = appData.currentContentPage <= 1 ? 'disabled' : '';
        const prevHTML = `
                    <li class="page-item ${prevDisabled}">
                        <a class="page-link" href="#" data-page="${appData.currentContentPage - 1}">上一页</a>
                    </li>
                `;
        container.innerHTML += prevHTML;

        // 页码按钮
        for (let i = 1; i <= totalPages; i++) {
            const active = i === appData.currentContentPage ? 'active' : '';
            const pageHTML = `
                        <li class="page-item ${active}">
                            <a class="page-link" href="#" data-page="${i}">${i}</a>
                        </li>
                    `;
            container.innerHTML += pageHTML;
        }

        // 下一页按钮
        const nextDisabled = appData.currentContentPage >= totalPages ? 'disabled' : '';
        const nextHTML = `
                    <li class="page-item ${nextDisabled}">
                        <a class="page-link" href="#" data-page="${appData.currentContentPage + 1}">下一页</a>
                    </li>
                `;
        container.innerHTML += nextHTML;
    },

    // 渲染成就完成排名表格
    achievementRankingTable() {
        const container = document.getElementById('achievementRankingTable');
        container.innerHTML = '';

        if (appData.achievementRankings.length === 0) {
            container.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center text-muted py-4">
                                <i class="fas fa-trophy fa-2x mb-2"></i>
                                <div>暂无成就排名数据</div>
                            </td>
                        </tr>
                    `;
            return;
        }

        // 根据排序方式对成就进行排序
        const sortBy = document.getElementById('achievementSortBy').value;
        let sortedAchievements = [...appData.achievementRankings];

        if (sortBy === 'completionRate') {
            sortedAchievements.sort((a, b) => b.completionRate - a.completionRate);
        } else if (sortBy === 'achievementCount') {
            sortedAchievements.sort((a, b) => b.count - a.count);
        } else {
            // 默认按排名排序
            sortedAchievements.sort((a, b) => a.rank - b.rank);
        }

        sortedAchievements.forEach((achievement) => {
            const rowHTML = `
                        <tr>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="${utils.getAchievementRankBadgeClass(achievement.rank)} me-2">
                                        ${achievement.rank}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div>
                                    <strong>${achievement.name}</strong>
                                    <div class="text-muted small">${achievement.description}</div>
                                    <div class="text-muted small">类别: ${achievement.category} | 标识: ${achievement.key}</div>
                                </div>
                            </td>
                            <td>
                                <span class="fw-bold">${utils.formatNumber(achievement.count)}</span> 人
                            </td>
                            <td>
                                <span class="fw-bold text-success">${utils.formatCompletionRate(achievement.completionRate)}</span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-outline-info view-achievement-detail" 
                                        data-achievement-key="${achievement.key}" 
                                        data-achievement-name="${achievement.name}">
                                    <i class="fas fa-info-circle"></i> 详情
                                </button>
                            </td>
                        </tr>
                    `;
            container.innerHTML += rowHTML;
        });
    },

    // 渲染成员详情模态框 - 使用真实API数据
    async renderMemberDetailModal(memberId, memberName) {
        const container = document.getElementById('memberDetailContent');

        // 显示加载状态
        container.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <div class="mt-2">正在加载成员详情...</div>
        </div>
    `;

        try {
            // 调用单个成员查询API
            const memberData = await apiService.fetchMemberDetail(memberId);
            const member = apiService.transformMemberDetailData(memberData);

            if (!member) {
                container.innerHTML = `
                <div class="alert alert-warning text-center">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <h5>成员不存在</h5>
                    <p>未找到ID为 ${memberId} 的成员信息</p>
                </div>
            `;
                return;
            }

            // 渲染历史分数图表
            let historyChartHTML = '';
            if (member.scoreHistory && member.scoreHistory.length > 0) {
                const maxScore = Math.max(...member.scoreHistory.map(h => h.des_score));
                const minScore = Math.min(...member.scoreHistory.map(h => h.des_score));
                const scoreRange = maxScore - minScore || 1;

                historyChartHTML = `
                <div class="mb-4">
                    <h6>历史分数趋势</h6>
                    <div class="card">
                        <div class="card-body">
                            <div class="score-history-chart" style="height: 150px; position: relative; border: 1px solid #e9ecef; border-radius: 4px;">
                                ${member.scoreHistory.map((history, index) => {
                    const x = (index / (member.scoreHistory.length - 1)) * 100;
                    const y = 100 - ((history.des_score - minScore) / scoreRange) * 100;
                    return `<div class="history-point" style="left: ${x}%; top: ${y}%;" title="${utils.formatDate(history.update_date)}: ${history.des_score}分"></div>`;
                }).join('')}
                            </div>
                            <div class="mt-2 small text-muted text-center">
                                显示 ${member.scoreHistory.length} 次历史分数记录
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }

            // 渲染成员详情
            const modalHTML = `
            <div class="mb-4">
                <div class="d-flex align-items-center mb-3">
                    <div class="member-avatar ${utils.getAvatarColor(member.name)} me-3" style="width: 48px; height: 48px; font-size: 18px;">
                        ${member.name.charAt(0)}
                    </div>
                    <div>
                        <h4 class="mb-1">${member.name}</h4>
                        <p class="text-muted mb-0">成员ID: ${member.id}</p>
                    </div>
                </div>
            </div>

            <div class="mb-4">
                <h6>基本信息</h6>
                <div class="row">
                    <div class="col-md-6">
                        <div class="card mb-2">
                            <div class="card-body py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span>主要领域</span>
                                    <div>
                                        <span class="badge ${utils.getDomainBadgeClass(member.domain)}">${member.domain || '未设置'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card mb-2">
                            <div class="card-body py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span>加入时间</span>
                                    <div>
                                        <span>${utils.formatDate(member.joinTime)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-4">
                <h6>等级信息</h6>
                <div class="row">
                    <div class="col-md-6">
                        <div class="card mb-2">
                            <div class="card-body py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span>等级</span>
                                    <div>
                                        <span class="badge ${utils.getLevelBadgeClass(member.level)} me-2">${utils.getLevelText(member.level)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card mb-2">
                            <div class="card-body py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span>影响力分数</span>
                                    <div>
                                        <small class="text-muted">${utils.formatNumber(member.score)}分</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-4">
                <h6>排名信息</h6>
                <div class="row">
                    <div class="col-md-12">
                        <div class="card">
                            <div class="card-body py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span>当前排名</span>
                                    <div>
                                        <span class="h5 ${member.rank ? 'text-primary' : 'text-muted'}">
                                            ${member.rank ? `第 ${member.rank} 名` : '未排名'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${historyChartHTML}

            <div>
                <h6>更多信息</h6>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    详细成就数据和内容统计功能正在开发中，敬请期待...
                </div>
            </div>
        `;

            container.innerHTML = modalHTML;

        } catch (error) {
            console.error('加载成员详情失败:', error);
            container.innerHTML = `
            <div class="alert alert-danger">
                <h5 class="alert-heading">加载失败</h5>
                <p>无法加载成员详情: ${error.message}</p>
                <hr>
                <p class="mb-0">请检查网络连接或稍后重试。</p>
            </div>
        `;
        }
    },

    // 渲染成就详情模态框
    async renderAchievementDetailModal(achievementKey, achievementName) {
        const container = document.getElementById('achievementDetailContent');

        // 显示加载状态
        container.innerHTML = `
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">加载中...</span>
                        </div>
                        <div class="mt-2">正在加载成就详情...</div>
                    </div>
                `;

        try {
            // 查找成就详情
            const achievement = appData.achievementRankings.find(a => a.key === achievementKey) ||
                appData.achievementList.find(a => a.key === achievementKey);

            if (!achievement) {
                container.innerHTML = `
                            <div class="alert alert-warning text-center">
                                <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                                <h5>成就不存在</h5>
                                <p>未找到标识为 ${achievementKey} 的成就信息</p>
                            </div>
                        `;
                return;
            }

            // 渲染成就详情
            const modalHTML = `
                        <div class="mb-4">
                            <div class="d-flex align-items-center mb-3">
                                <div class="${utils.getAchievementRankBadgeClass(achievement.rank)} me-3" style="width: 48px; height: 48px; font-size: 18px;">
                                    ${achievement.rank || 'N/A'}
                                </div>
                                <div>
                                    <h4 class="mb-1">${achievement.name}</h4>
                                    <p class="text-muted mb-0">成就标识: ${achievement.key}</p>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h6>完成统计</h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card mb-2">
                                        <div class="card-body py-2">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <span>完成人数</span>
                                                <div>
                                                    <span class="fw-bold">${utils.formatNumber(achievement.count || achievement.achievedCount)} 人</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card mb-2">
                                        <div class="card-body py-2">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <span>完成率</span>
                                                <div>
                                                    <span class="fw-bold text-success">${utils.formatCompletionRate(achievement.completionRate)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h6>成就描述</h6>
                            <div class="card">
                                <div class="card-body">
                                    <p class="mb-0">${achievement.description}</p>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h6>类别信息</h6>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="card">
                                        <div class="card-body py-2">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <span>成就类别</span>
                                                <div>
                                                    <span class="badge bg-secondary">${achievement.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h6>更多信息</h6>
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                详细完成成员列表和统计数据功能正在开发中，敬请期待...
                            </div>
                        </div>
                    `;

            container.innerHTML = modalHTML;

        } catch (error) {
            console.error('加载成就详情失败:', error);
            container.innerHTML = `
                        <div class="alert alert-danger">
                            <h5 class="alert-heading">加载失败</h5>
                            <p>无法加载成就详情: ${error.message}</p>
                            <hr>
                            <p class="mb-0">请检查网络连接或稍后重试。</p>
                        </div>
                    `;
        }
    },

    // 渲染内容详情模态框
    async renderContentDetailModal(contentId) {
        const container = document.getElementById('contentDetailContent');

        // 显示加载状态
        container.innerHTML = `
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">加载中...</span>
                        </div>
                        <div class="mt-2">正在加载内容详情...</div>
                    </div>
                `;

        try {
            // 调用单个内容查询API
            const contentData = await apiService.fetchContentDetail(contentId);
            const content = apiService.transformContentDetailData(contentData);

            if (!content) {
                container.innerHTML = `
                            <div class="alert alert-warning text-center">
                                <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                                <h5>内容不存在</h5>
                                <p>未找到ID为 ${contentId} 的内容信息</p>
                            </div>
                        `;
                return;
            }

            // 渲染内容详情
            const modalHTML = `
                        <div class="mb-4">
                            <div class="d-flex align-items-center mb-3">
                                <div class="member-avatar ${utils.getAvatarColor(content.authorName)} me-3" style="width: 48px; height: 48px; font-size: 18px;">
                                    ${content.authorName.charAt(0)}
                                </div>
                                <div>
                                    <h4 class="mb-1">内容详情</h4>
                                    <p class="text-muted mb-0">内容ID: ${content.id}</p>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h6>作者信息</h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card mb-2">
                                        <div class="card-body py-2">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <span>作者姓名</span>
                                                <div>
                                                    <span>${content.authorName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card mb-2">
                                        <div class="card-body py-2">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <span>作者ID</span>
                                                <div>
                                                    <span>${content.authorId}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h6>内容信息</h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card mb-2">
                                        <div class="card-body py-2">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <span>发布时间</span>
                                                <div>
                                                    <span>${utils.formatDateTime(content.publishTime)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card mb-2">
                                        <div class="card-body py-2">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <span>知识领域</span>
                                                <div>
                                                    <span class="badge ${utils.getDomainBadgeClass(content.domain)}">${content.domain}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h6>影响力统计</h6>
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="card mb-2">
                                        <div class="card-body py-2 text-center">
                                            <div class="text-primary fw-bold">${utils.formatNumber(content.score)}</div>
                                            <small class="text-muted">影响力分数</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card mb-2">
                                        <div class="card-body py-2 text-center">
                                            <div class="text-success fw-bold">${utils.formatNumber(content.likes)}</div>
                                            <small class="text-muted">点赞数</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card mb-2">
                                        <div class="card-body py-2 text-center">
                                            <div class="text-warning fw-bold">${utils.formatNumber(content.comments)}</div>
                                            <small class="text-muted">评论数</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card mb-2">
                                        <div class="card-body py-2 text-center">
                                            <div class="text-info fw-bold">${utils.formatNumber(content.shares)}</div>
                                            <small class="text-muted">转发数</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h6>排名信息</h6>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="card">
                                        <div class="card-body py-2">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <span>当前排名</span>
                                                <div>
                                                    <span class="h5 ${content.rank ? 'text-primary' : 'text-muted'}">
                                                        ${content.rank ? `第 ${content.rank} 名` : '未排名'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h6>更多信息</h6>
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                详细内容分析和互动数据功能正在开发中，敬请期待...
                            </div>
                        </div>
                    `;

            container.innerHTML = modalHTML;

        } catch (error) {
            console.error('加载内容详情失败:', error);
            container.innerHTML = `
                        <div class="alert alert-danger">
                            <h5 class="alert-heading">加载失败</h5>
                            <p>无法加载内容详情: ${error.message}</p>
                            <hr>
                            <p class="mb-0">请检查网络连接或稍后重试。</p>
                        </div>
                    `;
        }
    }
};

// 成员排名管理
const memberRankingManager = {
    // 加载成员排名数据
    async loadMemberRanking() {
        try {
            const domain = document.getElementById('domainFilter').value;
            const sortBy = document.getElementById('sortBy').value;

            const params = {
                count: 100, // 获取足够多的数据用于分页
                domain: domain,
                sort_by: sortBy
            };

            const memberData = await apiService.fetchMemberRanking(params);
            apiService.transformMemberRankingData(memberData);

            // 重置搜索状态
            appData.currentSearch.isSearching = false;
            appData.currentSearch.keyword = '';
            appData.currentSearch.domain = '';

            // 重新渲染成员排名表格和分页
            render.memberRankingTable();
            render.memberRankingPagination();
            render.renderSearchResultsHeader();

        } catch (error) {
            console.error('加载成员排名失败:', error);
            // 显示错误信息
            const container = document.getElementById('memberRankingTable');
            container.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center text-danger py-4">
                                <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                                <div>加载成员排名失败: ${error.message}</div>
                            </td>
                        </tr>
                    `;
        }
    },

    // 初始化成员排名事件监听
    initEventListeners() {
        // 领域筛选变化
        document.getElementById('domainFilter').addEventListener('change', () => {
            appData.currentMemberPage = 1; // 重置到第一页
            this.loadMemberRanking();
        });

        // 排序方式变化
        document.getElementById('sortBy').addEventListener('change', () => {
            appData.currentMemberPage = 1; // 重置到第一页
            this.loadMemberRanking();
        });

        // 分页大小变化
        document.getElementById('pageSize').addEventListener('change', (e) => {
            appData.memberPageSize = parseInt(e.target.value);
            appData.currentMemberPage = 1; // 重置到第一页
            render.memberRankingTable();
            render.memberRankingPagination();
        });

        // 分页点击事件 - 使用事件委托
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link')) {
                e.preventDefault();
                const page = parseInt(e.target.getAttribute('data-page'));
                if (page && page !== appData.currentMemberPage) {
                    appData.currentMemberPage = page;
                    render.memberRankingTable();
                    render.memberRankingPagination();
                }
            }
        });
    }
};

// 内容排名管理
const contentRankingManager = {
    // 加载内容排名数据
    async loadContentRanking() {
        try {
            const sortOrder = document.getElementById('contentSortBy').value;

            const params = {
                count: 100, // 获取足够多的数据用于分页
                sort_order: sortOrder
            };

            const contentData = await apiService.fetchContentRanking(params);
            apiService.transformContentRankingData(contentData);

            // 重新渲染内容排名表格和分页
            render.contentRankingTable();
            render.contentRankingPagination();

        } catch (error) {
            console.error('加载内容排名失败:', error);
            // 显示错误信息
            const container = document.getElementById('contentRankingTable');
            container.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center text-danger py-4">
                                <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                                <div>加载内容排名失败: ${error.message}</div>
                            </td>
                        </tr>
                    `;
        }
    },

    // 初始化内容排名事件监听
    initEventListeners() {
        // 排序方式变化
        document.getElementById('contentSortBy').addEventListener('change', () => {
            appData.currentContentPage = 1; // 重置到第一页
            this.loadContentRanking();
        });

        // 分页大小变化
        document.getElementById('contentPageSize').addEventListener('change', (e) => {
            appData.contentPageSize = parseInt(e.target.value);
            appData.currentContentPage = 1; // 重置到第一页
            render.contentRankingTable();
            render.contentRankingPagination();
        });

        // 分页点击事件 - 使用事件委托
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link') && e.target.closest('#contentPagination')) {
                e.preventDefault();
                const page = parseInt(e.target.getAttribute('data-page'));
                if (page && page !== appData.currentContentPage) {
                    appData.currentContentPage = page;
                    render.contentRankingTable();
                    render.contentRankingPagination();
                }
            }
        });
    }
};

// 成就排名管理
const achievementRankingManager = {
    // 加载成就排名数据
    async loadAchievementRanking() {
        try {
            const params = {
                count: 100, // 获取足够多的数据
                sort_order: 'desc'
            };

            const achievementData = await apiService.fetchAchievementRanking(params);
            apiService.transformAchievementRankingData(achievementData);

            // 重新渲染成就排名表格
            render.achievementRankingTable();

        } catch (error) {
            console.error('加载成就排名失败:', error);
            // 显示错误信息
            const container = document.getElementById('achievementRankingTable');
            container.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center text-danger py-4">
                                <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                                <div>加载成就排名失败: ${error.message}</div>
                            </td>
                        </tr>
                    `;
        }
    },

    // 加载成就清单数据
    async loadAchievementList() {
        try {
            const achievementData = await apiService.fetchAchievementList();
            apiService.transformAchievementListData(achievementData);

            // 重新渲染成就清单
            render.achievementList();

        } catch (error) {
            console.error('加载成就清单失败:', error);
            // 显示错误信息
            const container = document.getElementById('achievementCategories');
            container.innerHTML = `
                        <div class="col-12 text-center text-danger py-4">
                            <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                            <div>加载成就清单失败: ${error.message}</div>
                        </div>
                    `;
        }
    },

    // 初始化成就排名事件监听
    initEventListeners() {
        // 成就排序方式变化
        document.getElementById('achievementSortBy').addEventListener('change', () => {
            render.achievementRankingTable();
        });
    }
};

// 搜索功能管理
const searchManager = {
    // 搜索成员 - 使用专门的搜索接口
    async searchMembers(searchTerm) {
        if (!searchTerm.trim()) {
            alert('请输入搜索关键词');
            return;
        }

        try {
            // 显示加载状态
            const loadingOverlay = document.getElementById('loadingOverlay');
            loadingOverlay.style.display = 'flex';

            // 切换到成员排名页面
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

            document.querySelector('.nav-link[data-target="member-ranking"]').classList.add('active');
            document.getElementById('member-ranking').classList.add('active');

            // 获取当前选中的领域
            const domain = document.getElementById('domainFilter').value;

            // 调用专门的搜索API
            const searchParams = {
                keyword: searchTerm,
                domain: domain, // 使用领域筛选
                count: 100 // 获取足够多的结果用于分页
            };

            const searchData = await apiService.fetchMemberSearch(searchParams);
            const transformedData = apiService.transformMemberSearchData(searchData);

            // 更新数据并渲染
            appData.memberRankings = transformedData;
            appData.currentMemberPage = 1;

            // 设置搜索状态
            appData.currentSearch.isSearching = true;
            appData.currentSearch.keyword = searchTerm;
            appData.currentSearch.domain = domain;

            render.memberRankingTable();
            render.memberRankingPagination();
            render.renderSearchResultsHeader();

            // 隐藏加载指示器
            loadingOverlay.style.display = 'none';

            if (transformedData.length === 0) {
                alert(`未找到包含"${searchTerm}"的成员`);
            }

        } catch (error) {
            console.error('搜索成员失败:', error);
            const loadingOverlay = document.getElementById('loadingOverlay');
            loadingOverlay.style.display = 'none';
            alert(`搜索失败: ${error.message}`);
        }
    },

    // 清除搜索结果
    clearSearch() {
        appData.currentSearch.isSearching = false;
        appData.currentSearch.keyword = '';
        appData.currentSearch.domain = '';

        // 清空搜索框
        document.getElementById('memberSearch').value = '';

        // 重新加载成员排名数据
        memberRankingManager.loadMemberRanking();
    },

    // 初始化搜索事件监听
    initEventListeners() {
        // 搜索按钮点击事件
        document.getElementById('searchButton').addEventListener('click', () => {
            const searchTerm = document.getElementById('memberSearch').value;
            this.searchMembers(searchTerm);
        });

        // 搜索框回车事件
        document.getElementById('memberSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = document.getElementById('memberSearch').value;
                this.searchMembers(searchTerm);
            }
        });

        // 清除搜索按钮事件
        document.getElementById('clearSearch').addEventListener('click', () => {
            this.clearSearch();
        });
    }
};

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
    // 显示加载指示器
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    // 初始化成员排名事件监听
    memberRankingManager.initEventListeners();

    // 初始化内容排名事件监听
    contentRankingManager.initEventListeners();

    // 初始化成就排名事件监听
    achievementRankingManager.initEventListeners();

    // 初始化搜索事件监听
    searchManager.initEventListeners();

    // 从API获取数据 - 系统概览
    apiService.fetchSystemOverview()
        .then(apiData => {
            // 转换API数据
            apiService.transformSystemOverviewData(apiData);

            // 渲染系统概览相关数据
            render.systemStatus();
            render.statCards();
            render.ratingDistribution();
            render.topMembersList();
            render.topAchievementsList();

            // 隐藏加载指示器
            loadingOverlay.style.display = 'none';
        })
        .catch(error => {
            console.error('初始化系统概览数据失败:', error);

            // 显示错误信息
            const overviewSection = document.getElementById('overview');
            overviewSection.innerHTML = `
                        <div class="alert alert-danger">
                            <h4 class="alert-heading">数据加载失败</h4>
                            <p>无法从服务器获取系统概览数据。错误信息: ${error.message}</p>
                            <hr>
                            <p class="mb-0">请检查网络连接或联系系统管理员。</p>
                        </div>
                    `;

            // 隐藏加载指示器
            loadingOverlay.style.display = 'none';
        });

    // 导航菜单点击事件
    document.querySelectorAll('.nav-link[data-target]').forEach(link => {
        link.addEventListener('click', function () {
            // 移除所有活跃状态
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

            // 添加当前活跃状态
            this.classList.add('active');
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // 根据目标页面加载相应数据
            if (targetId === 'member-ranking') {
                memberRankingManager.loadMemberRanking();
            } else if (targetId === 'content-ranking') {
                contentRankingManager.loadContentRanking();
            } else if (targetId === 'achievement-ranking') {
                achievementRankingManager.loadAchievementRanking();
            } else if (targetId === 'achievement-list') {
                achievementRankingManager.loadAchievementList();
            }
        });
    });

    // 查看全部按钮点击事件
    document.querySelectorAll('button[data-target]').forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');

            // 更新导航状态
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

            document.querySelector(`.nav-link[data-target="${targetId}"]`).classList.add('active');
            document.getElementById(targetId).classList.add('active');

            // 根据目标页面加载相应数据
            if (targetId === 'member-ranking') {
                memberRankingManager.loadMemberRanking();
            } else if (targetId === 'content-ranking') {
                contentRankingManager.loadContentRanking();
            } else if (targetId === 'achievement-ranking') {
                achievementRankingManager.loadAchievementRanking();
            } else if (targetId === 'achievement-list') {
                achievementRankingManager.loadAchievementList();
            }
        });
    });

    // 查看成员详情 - 使用事件委托
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('view-detail') || e.target.closest('.view-detail')) {
            const button = e.target.classList.contains('view-detail') ? e.target : e.target.closest('.view-detail');
            const memberId = parseInt(button.getAttribute('data-member-id'));
            const memberName = button.getAttribute('data-member-name');

            // 使用新的异步函数渲染成员详情
            render.renderMemberDetailModal(memberId, memberName);

            const modal = new bootstrap.Modal(document.getElementById('memberDetailModal'));
            modal.show();
        }

        // 查看成就详情 - 使用事件委托
        if (e.target.classList.contains('view-achievement-detail') || e.target.closest('.view-achievement-detail')) {
            const button = e.target.classList.contains('view-achievement-detail') ? e.target : e.target.closest('.view-achievement-detail');
            const achievementKey = button.getAttribute('data-achievement-key');
            const achievementName = button.getAttribute('data-achievement-name');

            // 渲染成就详情
            render.renderAchievementDetailModal(achievementKey, achievementName);

            const modal = new bootstrap.Modal(document.getElementById('achievementDetailModal'));
            modal.show();
        }

        // 查看内容详情 - 使用事件委托
        if (e.target.classList.contains('view-content-detail') || e.target.closest('.view-content-detail')) {
            const button = e.target.classList.contains('view-content-detail') ? e.target : e.target.closest('.view-content-detail');
            const contentId = parseInt(button.getAttribute('data-content-id'));

            // 渲染内容详情
            render.renderContentDetailModal(contentId);

            const modal = new bootstrap.Modal(document.getElementById('contentDetailModal'));
            modal.show();
        }
    });
});