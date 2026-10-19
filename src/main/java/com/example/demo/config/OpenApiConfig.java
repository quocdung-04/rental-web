package com.example.demo.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Adds an "Authorize" button to Swagger UI: call POST /api/auth/login, then paste the token here. */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI ancuOpenApi() {
        return new OpenAPI()
                .info(new Info().title("AnCư API").version("1.0")
                        .description("Apartment Rental and Maintenance Portal. Write operations need the manager token."))
                .components(new Components().addSecuritySchemes("managerToken",
                        new SecurityScheme().type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER).name(ManagerAuthInterceptor.HEADER)))
                .addSecurityItem(new SecurityRequirement().addList("managerToken"));
    }
}
