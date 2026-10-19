package com.example.demo;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Needs a running SQL Server database; enable it once a test profile (H2 / Testcontainers) exists")
class DemoApplicationTests {

	@Test
	void contextLoads() {
	}

}
