1. [json-server]

```
{
  "users": [
    {
      "id": "1",
      "name": "홍길동",
      "email": "hong@test.com"
    },
    {
      "id": "2",
      "name": "김철수",
      "email": "kim@test.com"
    }
  ],
  "$schema": "./node_modules/json-server/schema.json"
}

```

(1)
```
{
  "scripts": {
    "start": "json-server db.json --port 3000"
  },
  "dependencies": {
    "json-server": "^0.17.4"
  }
}
```

2. [n8n]

3. spring-ai / java 21 / ollama
   (1) controller / AgentController


```
package com.company.ai_agent.controller;

import com.company.ai_agent.service.AgentService;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/agent")
public class AgentController {

    private final AgentService agentService;

    public AgentController(AgentService agentService) {
        this.agentService = agentService;
    }

    @PostMapping("/chat")
    public Map<String, String> chat(
        @RequestBody Map<String, String> request
    ) {

        String question = request.get("message");

        String answer = agentService.execute(question);

        return Map.of("answer", answer);
    }
}

```

  (2) service / AgentService


```
package com.company.ai_agent.service;

import com.company.ai_agent.tools.N8nTools;
import com.company.ai_agent.tools.UserTools;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class AgentService {

    private final ChatClient chatClient;

    // Tool 객체 멤버 변수 선언
    private final UserTools userTools;
    private final N8nTools n8nTools;
    
    public AgentService(
        ChatClient.Builder builder,
        UserTools userTools,
        N8nTools n8nTools
    ) {
        this.userTools = userTools;
        this.n8nTools = n8nTools;

        this.chatClient = builder
            .defaultSystem("""
                당신은 사용자 관리 업무를 수행하는 AI Agent입니다.

                다음 도구를 사용할 수 있습니다.

                1. 사용자 목록 조회
                2. 사용자 등록
                3. 사용자 삭제
                4. n8n 알림 실행

                사용자 등록 요청이 들어오면:
                - 사용자 ID와 사용자 이름과 이메일을 확인합니다.
                - 사용자 등록 도구를 실행합니다.
                - 등록이 성공하면 n8n 알림 도구를 실행합니다.
                - 최종 결과를 한국어로 설명합니다.

                이메일이 제공되지 않았다면 임의로 생성하지 말고
                사용자에게 이메일을 요청합니다.

                삭제 요청은 삭제 대상과 ID를 확인한 후 처리합니다.
                """)
            .build();
    }

    public String execute(String question) {

        return chatClient.prompt()
            .user(question)
            .tools(userTools, n8nTools)
            .call()
            .content();
    }
}


```

  (3) tools / N8nTools

```
package com.company.ai_agent.tools;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class N8nTools {

    private final RestClient restClient;

    public N8nTools(
        @Value("${app.n8n.webhook-url}") String webhookUrl
    ) {
        this.restClient = RestClient.create();
        this.webhookUrl = webhookUrl;
    }

    private final String webhookUrl;

    @Tool(description = "n8n Workflow를 실행하여 사용자 등록 알림을 전송한다.")
    public String sendNotification(String userName, String message) {

        Map<String, String> body = Map.of(
            "event", "USER_CREATED",
            "userName", userName,
            "message", message
        );

        return restClient.post()
            .uri(webhookUrl)
            .body(body)
            .retrieve()
            .body(String.class);
    }
}

```


  (4) tools / UserTools



```
package com.company.ai_agent.tools;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class UserTools {

    private final RestClient restClient;

    public UserTools(
        @Value("${app.json-server.url}") String url
    ) {
        this.restClient = RestClient.builder()
            .baseUrl(url)
            .build();
    }

    @Tool(description = "등록된 모든 사용자 목록을 조회한다.")
    public List<Map> getUsers() {

        return restClient.get()
            .uri("/users")
            .retrieve()
            .body(List.class);
    }

    @Tool(description = "새로운 사용자를 등록한다. 사용자 ID와 사용자 이름과 이메일이 필요하다.")
    public Map createUser(Long id, String name, String email) {

        Map<String, Object> user = Map.of(
            "id", id,
            "name", name,
            "email", email
        );
        
        System.out.println(" >>>  받은 id :: "+id + " , id :: "+user.get("id").toString());

        return restClient.post()
            .uri("/users")
            .body(user)
            .retrieve()
            .body(Map.class);
    }

    @Tool(description = "사용자 ID로 사용자를 삭제한다.")
    public String deleteUser(String id) {

        restClient.delete()
            .uri("/users/{id}", id)
            .retrieve()
            .toBodilessEntity();

        return "사용자 삭제 완료: " + id;
    }
}


```
