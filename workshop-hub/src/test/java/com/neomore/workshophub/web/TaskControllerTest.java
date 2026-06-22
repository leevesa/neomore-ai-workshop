package com.neomore.workshophub.web;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.neomore.workshophub.config.WorkshopProperties;
import com.neomore.workshophub.dto.TaskResponse;
import com.neomore.workshophub.service.WorkshopService;

@WebMvcTest(TaskController.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WorkshopService workshopService;

    @MockitoBean
    private WorkshopProperties properties;

    @Test
    void returnsSeededTaskList() throws Exception {
        when(workshopService.listTasks("demo")).thenReturn(List.of(
                new TaskResponse("connect", "Connect to the Workshop Hub", "desc", 1),
                new TaskResponse("cap-backend", "Explore the CAP backend", "desc", 2)));

        mockMvc.perform(get("/sessions/demo/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].taskId").value("connect"))
                .andExpect(jsonPath("$[1].ordinal").value(2));
    }
}
