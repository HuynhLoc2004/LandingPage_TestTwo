package com.example.back_end;

import com.example.back_end.entity.ProductSpec;
import com.example.back_end.repository.ProductSpecRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.boot.autoconfigure.r2dbc.R2dbcAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SpringBootApplication(exclude = {R2dbcAutoConfiguration.class})
@EnableCaching
@EnableScheduling
@EnableJpaRepositories(basePackages = "com.example.back_end.repository")
@EntityScan(basePackages = "com.example.back_end.entity")
public class BackEndApplication {

	private static final Logger logger = LoggerFactory.getLogger(BackEndApplication.class);

	@Autowired
	private ProductSpecRepository productSpecRepository;

	public static void main(String[] args) {
		SpringApplication.run(BackEndApplication.class, args);
	}

	@Transactional
	@PostConstruct
	public void initProductData() {
		String imgX = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1400&auto=format&fit=crop";
		String imgPro = "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=1400&auto=format&fit=crop";
		String imgLite = "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=1400&auto=format&fit=crop";

		if (!productSpecRepository.existsByProductName("Smartphone X")) {
			productSpecRepository.save(ProductSpec.builder()
					.productName("Smartphone X")
					.price(999.99)
					.heightMm(146.7)
					.widthMm(71.5)
					.depthMm(7.4)
					.wirelessNetwork("Wi-Fi 6E / 5G Ultra-wideband")
					.protocols("gRPC, WebSockets STOMP")
					.chipsetArch("Epoch v4 Neural Engine")
					.coresMatrix("16-Core Cluster Module")
					.imageUrl(imgX)
					.build());
			System.out.println("Smartphone X created.");
		}

		if (!productSpecRepository.existsByProductName("Smartphone X Pro")) {
			productSpecRepository.save(ProductSpec.builder()
					.productName("Smartphone X Pro")
					.price(1199.99)
					.heightMm(160.8)
					.widthMm(78.1)
					.depthMm(7.8)
					.wirelessNetwork("Wi-Fi 7 / 5G Advanced Satellite")
					.protocols("HTTP/3 QUIC, WebTransport")
					.chipsetArch("Epoch v4 Max Processor")
					.coresMatrix("24-Core GPU Cluster")
					.imageUrl(imgPro)
					.build());
			System.out.println("Smartphone X Pro created.");
		}

		if (!productSpecRepository.existsByProductName("Smartphone X Lite")) {
			productSpecRepository.save(ProductSpec.builder()
					.productName("Smartphone X Lite")
					.price(699.99)
					.heightMm(138.4)
					.widthMm(67.3)
					.depthMm(7.3)
					.wirelessNetwork("Wi-Fi 6 / 5G Standard")
					.protocols("REST API, SSE Streaming")
					.chipsetArch("Epoch v3 Core Engine")
					.coresMatrix("8-Core Base Module")
					.imageUrl(imgLite)
					.build());
			System.out.println("Smartphone X Lite created.");
		}
	}

	@Bean
	public CacheManager cacheManager() {
		return new ConcurrentMapCacheManager("products");
	}
}
