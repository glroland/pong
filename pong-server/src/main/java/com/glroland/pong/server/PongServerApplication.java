package com.glroland.pong.server;

import org.infinispan.configuration.cache.CacheMode;
import org.infinispan.configuration.cache.Configuration;
import org.infinispan.configuration.cache.ConfigurationBuilder;
import org.infinispan.eviction.EvictionType;
import org.infinispan.spring.starter.embedded.InfinispanCacheConfigurer;
import org.infinispan.spring.starter.embedded.InfinispanConfigurationCustomizer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;


@SpringBootApplication
@EnableCaching
public class PongServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(PongServerApplication.class, args);
	}

	@Bean
	public InfinispanCacheConfigurer cacheConfigurer() {
		return manager -> {
				final Configuration ispnConfig = new ConfigurationBuilder()
						.clustering()
						.cacheMode(CacheMode.LOCAL)
						.build();

				manager.defineConfiguration("local-sync-config", ispnConfig);
		};
	}

	@Bean(name = "large-cache")
	public org.infinispan.configuration.cache.Configuration largeCache() {
		return new ConfigurationBuilder()
			.memory().size(2000L)
			.build();
	}

	@Bean
	public InfinispanConfigurationCustomizer configurationCustomizer() {
		return builder -> builder.memory().evictionType(EvictionType.COUNT);
	}
}
